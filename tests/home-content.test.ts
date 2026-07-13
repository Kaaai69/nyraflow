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
  caption: string;
  isTemporary: boolean;
};

type HomeModule = {
  homeSectionOrder: readonly string[];
  homeContent: {
    credibility: { items: readonly unknown[] };
    services: { items: readonly unknown[] };
    process: { items: readonly unknown[] };
    faq: { items: readonly unknown[] };
    work: { media: readonly WorkMedia[] };
    team: { items: readonly { photo: ImageAsset }[] };
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
        team: { items: [] },
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
  it("references local JPEG media with matching dimensions", async () => {
    const { homeContent } = await loadHomeModule();
    const assets = [
      ...homeContent.work.media,
      ...homeContent.team.items.map((member) => member.photo),
    ];

    expect(homeContent.work.media).toHaveLength(3);
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

  it("labels temporary project media honestly", async () => {
    const { homeContent } = await loadHomeModule();
    const temporaryMedia = homeContent.work.media.filter(
      (media) => media.isTemporary,
    );

    expect(temporaryMedia).toHaveLength(2);
    expect(temporaryMedia.map((media) => media.caption)).toEqual([
      "Концепт",
      "Концепт",
    ]);
  });
});
