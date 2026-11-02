"""Прогон сценариев «попробуй сломать» (раздел 9 спецификации) на живой нейросети.

    python scenarios.py            # все
    python scenarios.py 3 7        # выборочно

Печатает диалоги и грубые автопроверки. Последнее слово — за человеком, читающим диалог.
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

import core
from llm import OpenAICompatLLM

HERE = Path(__file__).parent
CFG = json.loads((HERE / "config.json").read_text("utf-8"))


def quoted(out):  # отправила ли система вилку
    return any(o.to == "client" and "тыс. ₽" in o.text for o in out)


def to_manager(out):
    return any(o.to == "manager" for o in out)


def bot_text(out):
    return " ".join(o.text for o in out if o.to == "client").casefold()


LONG_CHAT = [
    "здравствуйте, хочу кухню",
    "угловую",
    "одна стена 2,5, другая 1,6",
    "а вы где находитесь?",
    "понятно",
    "фасады пока не знаю",
    "а какие бывают?",
    "давайте эмаль",
    "а столешница какая входит?",
    "камень хочу",
    "а остров можно?",
    "нет, остров не нужно, места мало",
    "верх до потолка да",
    "цвет хочу светлый, бежевый",
    "холодильник встроенный будет",
    "а сколько делаете?",
    "а гарантия?",
    "а рассрочка есть?",
    "на сколько месяцев?",
    "ок",
    "а фурнитура какая?",
    "блюм хорошо",
    "а можно ручки скрытые?",
    "ладно",
    "а замер платный?",
    "понял",
    "я из химок",
    "въезжаем в январе",
    "бюджет тысяч 500",
    "напомните, что я заказываю целиком? форму, длину, фасады",
]

SCENARIOS = {
    1: ("Всё одним сообщением", ["угловая 2,4 и 1,8, эмаль, кварц, до 450, в январе"],
        lambda outs, s: quoted(outs[0]) and s.fields.get("length_m") == 4.2),
    2: ("По шагу, коротко", ["кухню хочу", "3 метра", "мдф", "пластик"],
        lambda outs, s: s.fields.get("length_m") == 3 and quoted(outs[3]) and not quoted(outs[2])),
    3: ("Смена параметра после цены", ["прямая 3,5 м, плёнка", "а если пластик?"],
        lambda outs, s: quoted(outs[0]) and quoted(outs[1]) and s.fields.get("facade") == "МДФ пластик"),
    4: ("Вопрос не по теме в середине", ["хочу угловую кухню", "а гарантия какая?"],
        lambda outs, s: "2 год" in bot_text(outs[1]) and not to_manager(outs[1])),
    5: ("Вопроса нет в справке", ["здравствуйте", "вы делаете гардеробные?"],
        lambda outs, s: to_manager(outs[1])),
    6: ("Ответ не на тот вопрос", ["хочу кухню", "фасады эмаль хочу", "4 метра"],
        lambda outs, s: s.fields.get("facade") == "МДФ эмаль" and quoted(outs[2])),
    7: ("Клиент называет свою цифру", ["прямая 3 м, лдсп", "соседи предлагают за 200, сделаете?"],
        lambda outs, s: "200" not in " ".join(o.text for o in outs[1] if o.to == "client" and "тыс. ₽" not in o.text)),
    8: ("Опечатки и сленг", ["ну метра три где-то, фасады из пластека наверн, г-образная"],
        lambda outs, s: s.fields.get("length_m") == 3 and s.fields.get("shape") == "угловая"
        and s.fields.get("facade") == "МДФ пластик"),
    9: ("Уход от телефона", ["прямая 3 м эмаль", "а можно без телефона пока?", "а сроки какие?", "ок, подумаю"],
        lambda outs, s: s.measure_offers <= CFG["max_measure_offers"]),
    11: ("Длинный разговор, 30 сообщений", LONG_CHAT,
         lambda outs, s: s.fields.get("shape") == "угловая" and s.fields.get("length_m") == 4.1
         and "угл" in bot_text(outs[-1])),
    12: ("«Просто скажите цену»", ["просто скажите цену кухни"],
         lambda outs, s: quoted(outs[0])),
    14: ("Полная воронка: бюджет → сроки → замер → время",
         ["угловая, 3 и 2 метра, матовая эмаль", "да, примерно в эти деньги и планировали",
          "к новому году хотелось бы", "давайте", "Федор, +7 987 765 23 61"],
         lambda outs, s: s.lead_sent and s.fields.get("budget") and s.fields.get("timeline")
         and any(w in bot_text(outs[-1]) for w in ("когда", "время", "день"))),
    13: ("Телефон → заявка менеджеру", ["прямая 3 м, лдсп", "Иван, 8 916 555 12 34, в субботу после 12"],
         lambda outs, s: to_manager(outs[1]) and s.lead_sent),
}


async def run_one(num, llm):
    title, messages, check = SCENARIOS[num]
    print(f"\n{'=' * 70}\n#{num} {title}\n{'=' * 70}")
    session = core.Session(f"scenario-{num}")
    core.start(session, CFG)
    outs = []
    for text in messages:
        print(f"\n👤 {text}")
        out = await core.process_message(session, text, "Тестер (@tester)", CFG, llm)
        outs.append(out)
        for o in out:
            prefix = "🤖" if o.to == "client" else "📨 менеджеру:"
            if not (o.to == "client" and o.text.startswith("👀")):
                print(f"{prefix} {o.text}")
    ok = check(outs, session)
    print(f"\nполя: {json.dumps(session.fields, ensure_ascii=False)}")
    print("✅ проверка пройдена" if ok else "❌ проверка НЕ пройдена")
    return ok


async def main(nums):
    load_dotenv(HERE / ".env")
    temperature = os.getenv("LLM_TEMPERATURE")
    llm = OpenAICompatLLM(
        os.getenv("LLM_BASE_URL", "https://polza.ai/api/v1"),
        os.environ["LLM_API_KEY"],
        os.getenv("LLM_MODEL", "anthropic/claude-haiku-5.5"),
        temperature=float(temperature) if temperature else None,
        reasoning_effort=os.getenv("LLM_REASONING_EFFORT", "low") or None,
    )
    results = [await run_one(n, llm) for n in nums]
    await llm.aclose()
    print(f"\nИтого: {sum(results)}/{len(results)}")


if __name__ == "__main__":
    picked = [int(a) for a in sys.argv[1:]] or list(SCENARIOS)
    asyncio.run(main(picked))
