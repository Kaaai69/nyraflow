import { describe, expect, it } from "vitest";
import {
  legalIdentity,
  privacyDocument,
  termsDocument,
} from "../content/legal";

describe("legal content", () => {
  it("publishes the approved self-employed identity and contacts", () => {
    expect(legalIdentity).toEqual({
      brand: "nyraflow",
      fullName: "Шевцов Федор Дмитриевич",
      status:
        "Физическое лицо, применяющее специальный налоговый режим «Налог на профессиональный доход»",
      inn: "463309989306",
      email: "nyraflow@yandex.ru",
      phoneLabel: "+7 904 524 61 08",
      phoneHref: "tel:+79045246108",
      telegramLabel: "@nyraflow",
      telegramHref: "https://t.me/nyraflow",
    });
  });

  it("keeps exactly fourteen offer sections and separate requisites", () => {
    expect(termsDocument.sections).toHaveLength(14);
    expect(termsDocument.sections.map(({ title }) => title)).toEqual([
      "Термины и общие положения",
      "Заключение договора и юридическая сила переписки",
      "Предмет договора",
      "Порядок выполнения Проекта",
      "Стоимость и порядок оплаты",
      "Сдача и приёмка Результата",
      "Гарантийные исправления и техническая поддержка",
      "Исключительные права и лицензии",
      "Материалы Заказчика и законность Проекта",
      "Конфиденциальность и персональные данные",
      "Ответственность и ограничения",
      "Отказ от договора, приостановка и возвраты",
      "Претензии и споры",
      "Срок действия и изменение Оферты",
    ]);
    expect(termsDocument.requisites ?? []).toContain("ИНН: 463309989306");
    expect(JSON.stringify(termsDocument)).not.toMatch(/ОГРНИП|ИП Шевцов/);
  });

  it("limits the privacy policy to the approved data and purposes", () => {
    const policy = JSON.stringify(privacyDocument);

    expect(policy).toContain("имя");
    expect(policy).toContain("контакт");
    expect(policy).toContain("текст сообщения");
    expect(policy).toContain("отозвать согласие");
    expect(policy).not.toMatch(/рекламн(ая|ые) рассылк|пиксел|биометрическ/iu);
  });
});
