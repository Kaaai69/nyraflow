import asyncio
import json
from pathlib import Path

import core
from llm import parse_json_object

CFG = json.loads((Path(__file__).parent.parent / "config.json").read_text("utf-8"))
P = CFG["pricing"]


class FakeLLM:
    """Отдаёт заготовленные ответы по очереди и запоминает, что ему прислали."""

    def __init__(self, *answers):
        self.answers = list(answers)
        self.calls = []

    async def complete_json(self, messages, schema=None):
        self.calls.append(messages)
        return self.answers.pop(0)


def ans(reply="", updates=None, **flags):
    return {"reply": reply, "updates": updates or {}, **flags}


def run(session, text, llm):
    return asyncio.run(core.process_message(session, text, "Тест (@test)", CFG, llm))


def client_texts(out):
    return [o.text for o in out if o.to == "client"]


# ---------------------------------------------------------------- цена


def test_quote_matches_formula():
    q = core.calc_quote({"length_m": 4.2, "facade": "МДФ эмаль", "shape": "угловая", "countertop": "кварц"}, P)
    # 4.2 × (35000+35000) × 1.08 = 317 520 → 320 000; 4.2 × (48000+55000) × 1.08 = 467 208 → 465 000
    assert (q.low, q.high) == (320000, 465000)


def test_quote_island_and_ceiling():
    q = core.calc_quote({"length_m": 3, "facade": "ЛДСП", "island": True, "upper_to_ceiling": True}, P)
    # 3 × 18000 × 1.15 + 60000 = 122 100 → 120 000; 3 × 24000 × 1.15 + 120000 = 202 800 → 205 000
    assert (q.low, q.high) == (120000, 205000)


def test_no_quote_without_required():
    assert core.calc_quote({"length_m": 3}, P) is None


def test_quote_with_assumptions_marks_them():
    q = core.calc_quote({}, P, CFG["fallback_assumptions"])
    assert q.assumed == {"length_m": 3.0, "facade": "МДФ плёнка"}


def test_format_range():
    assert core.format_range(core.Quote(380000, 1460000, {})) == "380–1 460 тыс. ₽"


# --------------------------------------------------------- очистка полей


def test_clean_updates_rejects_unknown_values():
    u = core.clean_updates(
        {"facade": "мдф  ЭМАЛЬ", "countertop": "мрамор", "shape": "п-образная", "length_m": "4,2",
         "island": "нет", "foo": 1, "phone": "8 (999) 123-45-67"},
        P,
    )
    assert u == {"facade": "МДФ эмаль", "shape": "П-образная", "length_m": 4.2, "island": False,
                 "phone": "+7 999 123-45-67"}


def test_absurd_length_dropped():
    assert core.clean_updates({"length_m": 4200}, P) == {}


def test_notes_append_not_replace():
    fields = {"notes": ["светлые фасады"]}
    core.merge_fields(fields, {"notes": ["Светлые фасады", "встроенный холодильник"]})
    assert fields["notes"] == ["светлые фасады", "встроенный холодильник"]


def test_find_phone_variants():
    assert core.find_phone("мой номер +7 916 555 12 34, звоните") == "+7 916 555-12-34"
    assert core.find_phone("89165551234") == "+7 916 555-12-34"
    assert core.find_phone("угловая 2,4 и 1,8, до 450000") is None


def test_money_detector():
    assert core.has_money("Обычно выходит 300 тыс.")
    assert core.has_money("около 250 000")
    assert core.has_money("примерно 380000")
    assert not core.has_money("Гарантия 2 года, срок 25–35 рабочих дней, длина 4,2 м.")
    assert not core.has_money("Записал номер +7 999 123-45-67.")


def test_parse_json_tolerates_fences():
    assert parse_json_object('```json\n{"reply": "ok"}\n```') == {"reply": "ok"}
    assert parse_json_object('Вот ответ: {"reply": "ok"} готово') == {"reply": "ok"}


# --------------------------------------------------------------- диалог


def test_everything_in_one_message_gives_quote_with_invite():
    s = core.Session("1")
    llm = FakeLLM(ans("Отлично, вот ориентир:", {
        "shape": "угловая", "length_m": 4.2, "facade": "МДФ эмаль", "countertop": "кварц",
        "budget": "до 450 тыс.", "timeline": "январь"}))
    texts = client_texts(run(s, "угловая 2,4 и 1,8, эмаль, кварц, до 450, в январе", llm))
    assert texts[0] == "Отлично, вот ориентир:"
    assert "320–465" in texts[1] and "замер" in texts[1]
    assert s.measure_offers == 1


def test_step_by_step_then_recalc_on_change():
    s = core.Session("1")
    llm = FakeLLM(
        ans("Понял. А фасады из чего хотите?", {"length_m": 3}),
        ans("Отлично:", {"facade": "МДФ плёнка"}),
        ans("Пересчитал:", {"facade": "МДФ пластик"}),
        ans("Хорошо, учту."),
    )
    assert len(client_texts(run(s, "3 метра", llm))) == 1
    # 3 × 24000 = 72 000 → 70 000; 3 × 32000 = 96 000 → 95 000
    assert "70–95" in client_texts(run(s, "плёнка", llm))[1]
    recalc = client_texts(run(s, "а если пластик?", llm))
    assert "90–120" in recalc[1] and "Хотите, запишу" not in recalc[1]
    assert client_texts(run(s, "ок", llm)) == ["Хорошо, учту."]


def test_saying_no_island_does_not_requote():
    s = core.Session("1")
    llm = FakeLLM(ans("Вот ориентир:", {"length_m": 3, "facade": "ЛДСП"}), ans("Понятно.", {"island": False}))
    run(s, "3 м лдсп", llm)
    assert client_texts(run(s, "остров не нужен", llm)) == ["Понятно."]


def test_recalc_skips_disclaimer():
    s = core.Session("1")
    llm = FakeLLM(ans("Ок:", {"length_m": 3, "facade": "ЛДСП"}), ans("С пластиком так:", {"facade": "МДФ пластик"}))
    run(s, "3 м лдсп", llm)
    assert "Точную стоимость" not in client_texts(run(s, "а пластик?", llm))[1]


def test_internal_words_are_cut():
    s = core.Session("1")
    llm = FakeLLM(ans("Гардеробные в справке не указаны. Уточню у менеджера и вернусь с ответом."))
    assert client_texts(run(s, "гардеробные делаете?", llm))[0] == "Уточню у менеджера и вернусь с ответом."


def test_contact_asks_beyond_limit_are_cut():
    fields = {"length_m": 3, "facade": "ЛДСП"}
    s = core.Session("1", fields=fields, quoted_fingerprint=core._price_fingerprint(fields), measure_offers=2)
    llm = FakeLLM(ans("Гарантия 2 года. Как к вам обращаться?"), ans("Отлично. Как к вам обращаться?"))
    assert client_texts(run(s, "а гарантия?", llm)) == ["Гарантия 2 года."]
    # клиент сам заговорил о записи — спрашивать можно
    assert client_texts(run(s, "давайте замер", llm)) == ["Отлично. Как к вам обращаться?"]


def test_state_reaches_prompt():
    s = core.Session("1", fields={"length_m": 3, "facade": "ЛДСП"}, quoted_fingerprint="x")
    llm = FakeLLM(ans("Да"))
    run(s, "а гарантия?", llm)
    system = llm.calls[0][0]["content"]
    assert '"length_m": 3' in system and "уже отправлена" in system
    assert system.startswith("Ты — ИИ-ассистент") and "не выдаёшь себя за человека" in system


def test_wants_price_without_data_gives_assumption_estimate():
    s = core.Session("1")
    llm = FakeLLM(ans("Точную назовём после замера, а пока ориентир:", wants_price=True))
    texts = client_texts(run(s, "просто скажите цену", llm))
    assert "типичную кухню" in texts[1] and "Назовите длину" in texts[1]
    assert s.quoted_fingerprint is None


def test_wants_price_resends_existing_quote():
    s = core.Session("1")
    llm = FakeLLM(ans("Ок:", {"length_m": 3, "facade": "ЛДСП"}), ans("Без замера не обещаю.", wants_price=True))
    run(s, "3 м лдсп", llm)
    texts = client_texts(run(s, "соседи за 200 сделают, сделаете?", llm))
    assert "55–70" in texts[1]


def test_money_in_reply_is_retried_then_removed():
    s = core.Session("1")
    llm = FakeLLM(ans("Обычно около 200 тыс. Какая длина?"), ans("Всё равно 200 тыс. Какая длина?"))
    texts = client_texts(run(s, "сколько стоит?", llm))
    assert texts == ["Какая длина?"]


def test_manager_question_and_demo_copy():
    s = core.Session("1")
    llm = FakeLLM(ans("Уточню у менеджера и вернусь.", needs_manager=True, manager_question="Делаете гардеробные?"))
    out = run(s, "вы гардеробные делаете?", llm)
    assert [o.to for o in out] == ["client", "manager", "client"]
    assert "гардеробные" in out[1].text and out[2].text.startswith("👀")


def test_phone_triggers_lead_once_and_regex_fallback():
    s = core.Session("1", fields={"length_m": 3, "facade": "ЛДСП", "name": "Иван"}, quoted_fingerprint="x")
    llm = FakeLLM(ans("Спасибо! Когда удобно на замер?"), ans("Спасибо, жду звонка менеджера."))
    out = run(s, "89991234567", llm)
    manager = [o.text for o in out if o.to == "manager"]
    assert len(manager) == 1 and manager[0].startswith("🔔 Новая заявка")
    assert "Иван, в Telegram: Тест (@test), +7 999 123-45-67" in manager[0]
    assert "Ориентир: 55–70" in manager[0]
    out = run(s, "спасибо", llm)
    assert not [o for o in out if o.to == "manager"]


def test_first_quote_asks_budget_then_timeline_before_measure():
    s = core.Session("1")
    llm = FakeLLM(ans("Вот ориентир:", {"length_m": 3, "facade": "ЛДСП"}))
    assert "укладывается в бюджет" in client_texts(run(s, "3 м лдсп", llm))[1]
    assert s.measure_offers == 0

    s = core.Session("2")
    llm = FakeLLM(ans("Вот ориентир:", {"length_m": 3, "facade": "ЛДСП", "budget": "до 100"}))
    assert "когда планируете" in client_texts(run(s, "3 м лдсп, до 100", llm))[1]


def test_default_countertop_is_called_out_once():
    s = core.Session("1")
    llm = FakeLLM(ans("Вот ориентир:", {"length_m": 3, "facade": "ЛДСП"}), ans("С пластиком так:", {"facade": "МДФ пластик"}))
    assert "Столешница в расчёте — из ЛДСП" in client_texts(run(s, "3 м лдсп", llm))[1]
    assert "Столешница в расчёте" not in client_texts(run(s, "а пластик?", llm))[1]

    s = core.Session("2")
    llm = FakeLLM(ans("Вот ориентир:", {"length_m": 3, "facade": "ЛДСП", "countertop": "кварц"}))
    assert "Столешница в расчёте" not in client_texts(run(s, "3 м лдсп, кварц", llm))[1]


def test_price_objection_offers_cheaper_variant():
    s = core.Session("1", fields={"length_m": 4.5, "facade": "МДФ эмаль", "shape": "угловая",
                                  "countertop": "кварц", "upper_to_ceiling": True})
    s.quoted_fingerprint = core._price_fingerprint(s.fields)
    llm = FakeLLM(ans("Понимаю. Подобрать под бюджет можно.", price_objection=True))
    texts = client_texts(run(s, "дороговато, не укладываюсь", llm))
    assert texts[1].startswith("Как можно сэкономить: фасады МДФ пластик вместо МДФ эмаль, "
                               "столешница искусственный камень вместо кварц, верхние шкафы стандартной высоты")
    # Сам выбор клиента не меняется — это только вариант.
    assert s.fields["facade"] == "МДФ эмаль"


def test_no_cheaper_variant_for_cheapest_kitchen():
    assert core.cheaper_variant({"length_m": 3, "facade": "ЛДСП"}, P) is None


def test_budget_is_asked_once():
    s = core.Session("1")
    llm = FakeLLM(ans("Вот ориентир:", {"length_m": 3, "facade": "ЛДСП"}), ans("Конечно, можно без телефона."))
    run(s, "3 м лдсп", llm)
    assert s.asked == ["budget"]
    run(s, "можно без телефона?", llm)
    assert "Уже спрашивали (больше не спрашивай, даже если клиент не ответил): бюджет" in llm.calls[1][0]["content"]


def test_lead_score_reaches_manager():
    s = core.Session("1", fields={"length_m": 3, "facade": "ЛДСП"})
    llm = FakeLLM(ans("Спасибо! Когда удобно принять замерщика?", {"phone": "89991234567"},
                      lead_score="hot", lead_score_reason="сам записался, кухня нужна в декабре"))
    manager = [o.text for o in run(s, "89991234567", llm) if o.to == "manager"]
    assert manager[0].endswith("Оценка: 🔥 горячий — сам записался, кухня нужна в декабре")


def test_greeting_is_one_message():
    out = core.start(core.Session("1"), CFG)
    assert len(out) == 1 and "Демо-версия" in out[0].text


def test_name_matching_telegram_label_is_not_repeated():
    fields = {"name": "Фёдор", "phone": "+7 987 765-23-61"}
    summary = core.lead_summary(fields, "Федор (@nyraflow)", CFG, update=False)
    assert summary.splitlines()[1] == "Федор (@nyraflow), +7 987 765-23-61"


def test_llm_failure_asks_to_repeat_and_keeps_history_clean():
    class Broken:
        async def complete_json(self, messages, schema=None):
            raise core.LLMError("нет")

    s = core.Session("1")
    out = run(s, "привет", Broken())
    assert "Повторите" in out[0].text and s.history == []


def test_history_is_trimmed():
    s = core.Session("1", history=[{"role": "user", "content": str(i)} for i in range(40)])
    run(s, "ещё", FakeLLM(ans("ок")))
    assert len(s.history) == core.HISTORY_LIMIT
