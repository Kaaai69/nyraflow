import { describe, expect, it } from "vitest";
import {
  legalIdentity,
  privacyDocument,
  termsDocument,
} from "../content/legal";

const offerIntroduction =
  "Физическое лицо Шевцов Федор Дмитриевич, ИНН 463309989306, применяющее специальный налоговый режим «Налог на профессиональный доход» (далее — «Исполнитель»), публикует настоящую оферту и предлагает заключить договор на изложенных ниже условиях любому дееспособному физическому лицу, индивидуальному предпринимателю или юридическому лицу (далее — «Заказчик»).";

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
    expect(termsDocument.sections.map(({ id }) => id)).toEqual(
      Array.from({ length: 14 }, (_, index) => `section-${index + 1}`),
    );
    expect(
      termsDocument.sections.reduce(
        (total, section) => total + section.paragraphs.length,
        0,
      ),
    ).toBe(81);
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
    expect(termsDocument.requisites).toEqual([
      "Исполнитель: Шевцов Федор Дмитриевич",
      "Статус: физическое лицо, применяющее специальный налоговый режим «Налог на профессиональный доход» (самозанятый)",
      "ИНН: 463309989306",
      "Сайт: https://nyraflow.ru/",
      "Email: nyraflow@yandex.ru",
      "Банковские реквизиты сообщаются в счёте, платёжной ссылке или переписке Сторон.",
    ]);
    expect(termsDocument.introduction).toEqual([offerIntroduction]);
    expect(JSON.stringify(termsDocument)).not.toMatch(/ОГРНИП|ИП Шевцов/);
  });

  it("limits the privacy policy to the approved data and purposes", () => {
    const policy = JSON.stringify(privacyDocument);

    expect(privacyDocument.sections.map(({ id }) => id)).toEqual([
      "general",
      "operator",
      "principles",
      "data",
      "purposes",
      "operations",
      "transfer",
      "storage",
      "security",
      "rights",
      "requests",
      "changes",
    ]);

    expect(policy).toContain("имя");
    expect(policy).toContain("контакт");
    expect(policy).toContain("текст сообщения");
    expect(policy).toContain("отозвать согласие");
    expect(policy).toContain(
      "Форма обращения на сайте в текущей версии неактивна и не передаёт персональные данные Оператору.",
    );
    expect(policy).toContain("IP-адрес");
    expect(policy).toContain("дату и время запроса");
    expect(policy).toContain("URL запрошенной страницы");
    expect(policy).toContain("реферер");
    expect(policy).toContain("user-agent");
    expect(policy).toContain("параметры браузера, устройства и операционной системы");
    expect(policy).toContain("технические журналы и журналы ошибок");
    expect(policy).toContain("Vercel");
    expect(policy).toContain("prod.spline.design");
    expect(policy).toContain(
      "государственным органам допускается только в случаях и порядке, предусмотренных законодательством Российской Федерации",
    );
    expect(policy).toContain(
      "Трансграничная передача может осуществляться только если поставщик инфраструктуры обрабатывает данные за пределами Российской Федерации",
    );
    expect(policy).toContain(
      "только после выполнения применимых требований законодательства Российской Федерации",
    );
    expect(policy).toContain(
      "Перед публикацией активной формы Политика, текст согласия и фактический маршрут передачи и обработки данных должны быть повторно проверены.",
    );
    expect(policy).not.toMatch(
      /cookie|куки|аналитик|рекламн(?:ый|ые|ых) пиксел|маркетингов(?:ая|ые|ых) рассылк|биометрическ/iu,
    );
  });
});
