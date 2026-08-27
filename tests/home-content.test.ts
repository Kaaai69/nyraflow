import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");
const contentModulePath = "../content/home";

type ImageAsset = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

type WorkMedia = ImageAsset & {
  id: string;
  title: string;
  caption: string;
  status: "published";
  href: string;
  cta: string;
};

type HomeModule = {
  homeSectionOrder: readonly string[];
  homeContent: {
    credibility: { items: readonly unknown[] };
    problem: { title: string };
    metrics: {
      items: readonly {
        id: string;
        value: string;
        title: string;
        description: string;
      }[];
    };
    starter: {
      title: string;
      price: string;
      items: readonly {
        id: string;
        title: string;
        description: string;
        icon: string;
      }[];
    };
    pricing: {
      title: string;
      cta: string;
      items: readonly {
        id: string;
        title: string;
        price: string;
        description: string;
        included: readonly string[];
        optional?: readonly string[];
      }[];
    };
    services: { items: readonly unknown[] };
    process: { items: readonly unknown[] };
    faq: { items: readonly unknown[] };
    work: { media: readonly WorkMedia[] };
    team: {
      title: string;
      items: readonly {
        id: string;
        name: string;
        role: string;
        photo: ImageAsset;
      }[];
    };
  };
};

async function loadHomeModule(): Promise<HomeModule> {
  if (!existsSync(resolve(projectRoot, "content/home.ts"))) {
    return {
      homeSectionOrder: [],
      homeContent: {
        credibility: { items: [] },
        problem: { title: "" },
        metrics: { items: [] },
        starter: { title: "", price: "", items: [] },
        pricing: { title: "", cta: "", items: [] },
        services: { items: [] },
        process: { items: [] },
        faq: { items: [] },
        work: { media: [] },
        team: { title: "", items: [] },
      },
    };
  }

  return import(contentModulePath) as Promise<HomeModule>;
}

function readJpegDimensions(path: string) {
  const image = readFileSync(path);

  expect(image[0]).toBe(0xff);
  expect(image[1]).toBe(0xd8);

  let offset = 2;

  while (offset < image.length) {
    while (image[offset] === 0xff) offset += 1;

    const marker = image[offset];
    offset += 1;

    if (marker === 0xd8 || marker === 0xd9) continue;

    const segmentLength = image.readUInt16BE(offset);
    const isStartOfFrame =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);

    if (isStartOfFrame) {
      return {
        width: image.readUInt16BE(offset + 5),
        height: image.readUInt16BE(offset + 3),
      };
    }

    offset += segmentLength;
  }

  throw new Error(`Could not read JPEG dimensions for ${path}`);
}

describe("home content contract", () => {
  it("expresses the conversion sequence as data", async () => {
    const { homeSectionOrder } = await loadHomeModule();

    expect(homeSectionOrder).toEqual([
      "hero",
      "credibility",
      "problem",
      "metrics",
      "work",
      "starter",
      "pricing",
      "services",
      "team",
      "process",
      "faq",
      "benefits",
      "contact",
    ]);
  });

  it("defines the commercial offer content", async () => {
    const { homeContent } = await loadHomeModule();

    expect(homeContent.problem.title).toBe(
      "Создаем сайты, которые окупают трафик, а не просто «красиво висят» в интернете.",
    );
    expect(homeContent.metrics.items.map((item) => item.value)).toEqual([
      "2+",
      "20+",
      "100%",
    ]);
    expect(homeContent.starter.price).toBe("от 30 000 ₽");
    expect(homeContent.starter.items).toHaveLength(4);
    expect(
      homeContent.pricing.items.map(({ title, price }) => ({ title, price })),
    ).toEqual([
      { title: "Лендинг", price: "от 30 000 ₽" },
      { title: "Веб-сервис / Telegram Mini App", price: "от 60 000 ₽" },
      { title: "Сайт + AI-автоматизация", price: "от 120 000 ₽" },
    ]);
    expect(homeContent.pricing.cta).toBe("Обсудить проект");
    expect(homeContent.pricing.items[0]?.included).toEqual([
      "Маркетинговая упаковка",
      "Адаптация под мобильные устройства",
      "Базовая SEO-настройка",
      "Форма заявки в Telegram",
    ]);
    expect(homeContent.pricing.items[0]?.optional).toEqual([
      "Индивидуальный или анимированный дизайн",
      "Расширенное количество секций",
      "Углублённая SEO-настройка",
    ]);
  });

  it.each([
    ["credibility", 3],
    ["services", 3],
    ["process", 5],
    ["faq", 6],
  ] as const)("provides the required %s item count", async (section, count) => {
    const { homeContent } = await loadHomeModule();

    expect(homeContent[section].items).toHaveLength(count);
  });

  it("keeps the unconfirmed working brand out of public content", () => {
    const contentPath = resolve(projectRoot, "content/home.ts");
    const source = existsSync(contentPath) ? readFileSync(contentPath, "utf8") : "";

    expect(source).not.toContain("MyLand");
  });
});

describe("home content assets", () => {
  it("defines the approved team heading and three verified members", async () => {
    const { homeContent } = await loadHomeModule();

    expect(homeContent.team.title).toBe(
      "Три человека. Одна ответственность за результат.",
    );
    expect(
      homeContent.team.items.map(({ id, name, role }) => ({ id, name, role })),
    ).toEqual([
      { id: "fedor", name: "Федор", role: "Founder" },
      { id: "arseniy", name: "Арсений", role: "Co-Founder & CGO" },
      { id: "artem", name: "Артём", role: "CMO" },
    ]);
  });

  it("references local media with matching dimensions", async () => {
    const { homeContent } = await loadHomeModule();
    const assets = [
      ...homeContent.work.media,
      ...homeContent.team.items.map((member) => member.photo),
    ];

    expect(homeContent.work.media).toHaveLength(9);
    expect(homeContent.team.items).toHaveLength(3);

    for (const media of assets) {
      const assetPath = resolve(projectRoot, `public${media.src}`);

      expect(existsSync(assetPath), `${media.src} should exist`).toBe(true);

      if (media.src.endsWith(".webp")) {
        const image = readFileSync(assetPath);

        expect(image.subarray(0, 4).toString("ascii")).toBe("RIFF");
        expect(image.subarray(8, 12).toString("ascii")).toBe("WEBP");
        continue;
      }

      expect(readJpegDimensions(assetPath)).toEqual({
        width: media.width,
        height: media.height,
      });
    }
  });

  it("publishes the nine approved projects in editorial order", async () => {
    const { homeContent } = await loadHomeModule();
    const projects = homeContent.work.media;

    expect(projects).toHaveLength(9);
    expect(projects.every((project) => project.status === "published")).toBe(true);
    expect(new Set(projects.map((project) => project.href)).size).toBe(9);
    expect(
      projects.map(({ title, caption, href }) => ({ title, caption, href })),
    ).toEqual([
      {
        title: "BRABUS",
        caption: "Тюнинг-ателье суперкаров",
        href: "https://landings-for-message.vercel.app/",
      },
      {
        title: "OH Architecture",
        caption: "Архитектурное бюро",
        href: "https://landings-for-message.vercel.app/oharchitecture/",
      },
      {
        title: "Laser and Me",
        caption: "Лазерная косметология",
        href: "https://landings-for-message.vercel.app/laserandme/",
      },
      {
        title: "New Legend 4x4",
        caption: "Кастомные рестомоды",
        href: "https://landings-for-message.vercel.app/newlegend4x4/",
      },
      {
        title: "Skin Laundry",
        caption: "Сеть клиник лазерного ухода",
        href: "https://landings-for-message.vercel.app/skinlaundry/",
      },
      {
        title: "LAVA dental studio",
        caption: "Стоматология",
        href: "https://landings-for-message.vercel.app/lavadental/",
      },
      {
        title: "Nordiska Kök",
        caption: "Скандинавские кухни",
        href: "https://landings-for-message.vercel.app/nordiskakok/",
      },
      {
        title: "Мастерская Rodewald",
        caption: "Авторская мебель на заказ",
        href: "https://landings-for-message.vercel.app/rodewald/",
      },
      {
        title: "Ultraviolet Way",
        caption: "Диджитал-продакшн",
        href: "https://landings-for-message.vercel.app/ultraviolet-way/",
      },
    ]);
    expect(projects.every((project) => project.cta === "Открыть проект")).toBe(true);
    expect(projects.every((project) => project.alt.trim().length > 0)).toBe(true);
  });
});
