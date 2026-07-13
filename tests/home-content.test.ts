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
    services: { items: readonly unknown[] };
    process: { items: readonly unknown[] };
    faq: { items: readonly unknown[] };
    work: { media: readonly WorkMedia[] };
    team: {
      title: string;
      items: readonly { name: string; role: string; photo: ImageAsset }[];
    };
  };
};

async function loadHomeModule(): Promise<HomeModule> {
  if (!existsSync(resolve(projectRoot, "content/home.ts"))) {
    return {
      homeSectionOrder: [],
      homeContent: {
        credibility: { items: [] },
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
      "work",
      "services",
      "team",
      "process",
      "faq",
      "contact",
    ]);
  });

  it.each([
    ["credibility", 3],
    ["services", 3],
    ["process", 4],
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
  it("defines the approved team heading and two verified members", async () => {
    const { homeContent } = await loadHomeModule();

    expect(homeContent.team.title).toBe(
      "Три человека. Одна ответственность за результат.",
    );
    expect(
      homeContent.team.items.map(({ name, role }) => ({ name, role })),
    ).toEqual([
      { name: "Арсений", role: "Backend & Automation Engineer" },
      { name: "Артём", role: "Frontend & Product Developer" },
    ]);
  });

  it("references local JPEG media with matching dimensions", async () => {
    const { homeContent } = await loadHomeModule();
    const assets = [
      ...homeContent.work.media,
      ...homeContent.team.items.map((member) => member.photo),
    ];

    expect(homeContent.work.media).toHaveLength(10);
    expect(homeContent.team.items).toHaveLength(2);

    for (const media of assets) {
      const assetPath = resolve(projectRoot, `public${media.src}`);

      expect(existsSync(assetPath), `${media.src} should exist`).toBe(true);
      expect(readJpegDimensions(assetPath)).toEqual({
        width: media.width,
        height: media.height,
      });
    }
  });

  it("publishes the ten approved projects in editorial order", async () => {
    const { homeContent } = await loadHomeModule();
    const projects = homeContent.work.media;

    expect(projects).toHaveLength(10);
    expect(projects.every((project) => project.status === "published")).toBe(true);
    expect(new Set(projects.map((project) => project.href)).size).toBe(10);
    expect(
      projects.map(({ title, caption, href }) => ({ title, caption, href })),
    ).toEqual([
      {
        title: "Atelier Kitchens",
        caption: "Кухонная студия",
        href: "https://atelier-kitchens.vercel.app",
      },
      {
        title: "Лингва.Академия",
        caption: "Онлайн-школа языков",
        href: "https://premium-school-landing.vercel.app",
      },
      {
        title: "Silenzio",
        caption: "Загородный глэмпинг",
        href: "https://glamping-silenzio.vercel.app",
      },
      {
        title: "Мезонин",
        caption: "Агентство недвижимости",
        href: "https://aether-landing-liard.vercel.app",
      },
      {
        title: "Дом в деталях",
        caption: "Мебель на заказ",
        href: "https://furniture-tau-two.vercel.app",
      },
      {
        title: "Florea",
        caption: "Цветочная студия",
        href: "https://florist-six.vercel.app",
      },
      {
        title: "Amore",
        caption: "Свадебное агентство",
        href: "https://amore-liart.vercel.app",
      },
      {
        title: "SOUL",
        caption: "Студия йоги и пилатеса",
        href: "https://soul-dun-two.vercel.app",
      },
      {
        title: "Detail Pro",
        caption: "Студия автодетейлинга",
        href: "https://detailing-silk.vercel.app",
      },
      {
        title: "Groom Atelier",
        caption: "Салон груминга",
        href: "https://groom-woad.vercel.app",
      },
    ]);
    expect(projects.every((project) => project.cta === "Открыть проект")).toBe(true);
    expect(projects.every((project) => project.alt.trim().length > 0)).toBe(true);
  });
});
