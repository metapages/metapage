/// <reference types="@vitest/browser/providers/playwright" />

import {
  convertMetapageDefinitionToCurrentVersion,
  convertMetaframeJsonToCurrentVersion,
  normalizeHashParams,
  MetapageDefinitionV1,
  MetapageDefinitionV2,
  MetapageVersionCurrent,
  MetaframeDefinitionV2,
  HashParamsObject,
  detectMetapageVersion,
  detectMetaframeVersion,
} from "../src";
import { describe, expect, it } from "vitest";
import { MetapageDefinitionV03 } from "../src/metapage/v0_3/all";

describe("metapage version conversions", async () => {
  it("the version field is set to the correct version", async () => {
    let metapageLatest = await convertMetapageDefinitionToCurrentVersion(
      ExampleMetapageDefinitionV1,
    );
    expect(MetapageVersionCurrent).to.equal("2");
    expect(MetapageVersionCurrent).to.equal(metapageLatest.version);

    metapageLatest = await convertMetapageDefinitionToCurrentVersion(
      ExampleMetapageDefinitionV03,
    );
    expect(MetapageVersionCurrent).to.equal("2");
    expect(MetapageVersionCurrent).to.equal(metapageLatest.version);

    metapageLatest = await convertMetapageDefinitionToCurrentVersion(
      ExampleMetapageDefinitionV2,
    );
    expect(MetapageVersionCurrent).to.equal("2");
    expect(MetapageVersionCurrent).to.equal(metapageLatest.version);
  });
});

const ExampleMetapageDefinitionV1: MetapageDefinitionV1 = {
  version: "1",
  metaframes: {
    mf1: {
      id: "obsolete",
      url: "https://example.com",
    },
  },
};

const ExampleMetapageDefinitionV2: MetapageDefinitionV2 = {
  version: "2",
  metaframes: {
    mf1: {
      id: "obsolete",
      url: "https://example.com",
    },
  },
};

const ExampleMetapageDefinitionV03: MetapageDefinitionV03 = {
  version: "0.3",
  metaframes: {
    mf1: {
      metaframe: {
        version: "0.3",
        metadata: {
          title: "A button example",
          author: "Dion Whitehead",
        },
        inputs: {},
        outputs: {},
      },
      id: "obsolete",
      url: "https://example.com",
    },
  },
};

describe("hashParams normalization", () => {
  describe("normalizeHashParams", () => {
    it("returns undefined for undefined input", () => {
      expect(normalizeHashParams(undefined)).to.be.undefined;
    });

    it("converts array format to object format", () => {
      const arrayFormat = ["foo", "bar", "baz"];
      const result = normalizeHashParams(arrayFormat);

      expect(result).to.deep.equal({
        foo: {},
        bar: {},
        baz: {},
      });
    });

    it("passes through object format unchanged", () => {
      const objectFormat: HashParamsObject = {
        foo: { type: "string", label: "Foo Label" },
        bar: { type: "boolean", description: "A boolean param" },
        baz: { type: "json", value: { default: true } },
      };
      const result = normalizeHashParams(objectFormat);

      expect(result).to.deep.equal(objectFormat);
    });

    it("handles empty array", () => {
      const result = normalizeHashParams([]);
      expect(result).to.deep.equal({});
    });

    it("handles empty object", () => {
      const result = normalizeHashParams({});
      expect(result).to.deep.equal({});
    });
  });

  describe("convertMetaframeJsonToCurrentVersion with hashParams", () => {
    it("normalizes array hashParams during conversion", async () => {
      const definition: MetaframeDefinitionV2 = {
        version: "2",
        metadata: { name: "Test Metaframe" },
        hashParams: ["param1", "param2"],
      };

      const result = await convertMetaframeJsonToCurrentVersion(definition);

      expect(result?.hashParams).to.deep.equal({
        param1: {},
        param2: {},
      });
    });

    it("preserves object hashParams during conversion", async () => {
      const hashParams: HashParamsObject = {
        param1: { type: "string", label: "Parameter 1" },
        param2: { type: "number", description: "A numeric param", value: 42 },
      };
      const definition: MetaframeDefinitionV2 = {
        version: "2",
        metadata: { name: "Test Metaframe" },
        hashParams,
      };

      const result = await convertMetaframeJsonToCurrentVersion(definition);

      expect(result?.hashParams).to.deep.equal(hashParams);
    });

    it("handles definition without hashParams", async () => {
      const definition: MetaframeDefinitionV2 = {
        version: "2",
        metadata: { name: "Test Metaframe" },
      };

      const result = await convertMetaframeJsonToCurrentVersion(definition);

      expect(result?.hashParams).to.be.undefined;
    });

    it("normalizes hashParams when converting from v1 to v2", async () => {
      // V1 doesn't have hashParams, but if somehow one is present it should be normalized
      const definition = {
        version: "1",
        metadata: { name: "Test Metaframe", author: "Test Author" },
        hashParams: ["legacyParam"],
      } as any;

      const result = await convertMetaframeJsonToCurrentVersion(definition);

      expect(result?.version).to.equal("2");
      expect(result?.hashParams).to.deep.equal({
        legacyParam: {},
      });
    });
  });
});

describe("version detection", () => {
  describe("detectMetapageVersion", () => {
    it("returns version directly if already set", () => {
      expect(detectMetapageVersion({ version: "1" })).to.equal("1");
      expect(detectMetapageVersion({ version: "0.3" })).to.equal("0.3");
      expect(detectMetapageVersion({ version: "2" })).to.equal("2");
    });

    it("detects v0.2 from embedded metaframe property without plugins", () => {
      expect(
        detectMetapageVersion({
          metaframes: {
            mf1: {
              metaframe: { version: "0.3", metadata: {} },
              url: "https://example.com",
            },
          },
        }),
      ).to.equal("0.2");
    });

    it("detects v0.3 from embedded metaframe property with plugins", () => {
      expect(
        detectMetapageVersion({
          metaframes: {
            mf1: {
              metaframe: { version: "0.3", metadata: {} },
              url: "https://example.com",
            },
          },
          plugins: ["https://plugin.example.com"],
        }),
      ).to.equal("0.3");
    });

    it("detects v1 from meta.keywords", () => {
      expect(
        detectMetapageVersion({
          metaframes: { mf1: { url: "https://example.com" } },
          meta: { keywords: ["test"] },
        }),
      ).to.equal("1");
    });

    it("detects v1 from meta.author (string)", () => {
      expect(
        detectMetapageVersion({
          metaframes: { mf1: { url: "https://example.com" } },
          meta: { author: "Dion" },
        }),
      ).to.equal("1");
    });

    it("defaults to v2 when no distinguishing features", () => {
      expect(
        detectMetapageVersion({
          metaframes: { mf1: { url: "https://example.com" } },
        }),
      ).to.equal("2");
    });
  });

  describe("detectMetaframeVersion", () => {
    it("returns version directly if already set", () => {
      expect(detectMetaframeVersion({ version: "0.3" })).to.equal("0.3");
      expect(detectMetaframeVersion({ version: "1" })).to.equal("1");
      expect(detectMetaframeVersion({ version: "2" })).to.equal("2");
    });

    it("detects v0.3 from metadata.title", () => {
      expect(
        detectMetaframeVersion({
          metadata: { title: "My Frame", author: "Author" },
        }),
      ).to.equal("0.3");
    });

    it("detects v0.4 from metadata.title with allow", () => {
      expect(
        detectMetaframeVersion({
          metadata: { title: "My Frame" },
          allow: "camera",
        }),
      ).to.equal("0.4");
    });

    it("detects v0.5 from metadata.edit", () => {
      expect(
        detectMetaframeVersion({
          metadata: { name: "My Frame", edit: { type: "url", value: {} } },
        }),
      ).to.equal("0.5");
    });

    it("detects v0.6 from metadata.operations", () => {
      expect(
        detectMetaframeVersion({
          metadata: { name: "My Frame", operations: { edit: {} } },
        }),
      ).to.equal("0.6");
    });

    it("detects v1 from metadata.author (string)", () => {
      expect(
        detectMetaframeVersion({
          metadata: { name: "My Frame", author: "Dion" },
        }),
      ).to.equal("1");
    });

    it("detects v2 from metadata.authors (array)", () => {
      expect(
        detectMetaframeVersion({
          metadata: { name: "My Frame", authors: ["Dion"] },
        }),
      ).to.equal("2");
    });

    it("detects v2 from hashParams", () => {
      expect(
        detectMetaframeVersion({
          metadata: { name: "My Frame" },
          hashParams: ["foo"],
        }),
      ).to.equal("2");
    });

    it("detects v2 from sandbox", () => {
      expect(
        detectMetaframeVersion({
          metadata: { name: "My Frame" },
          sandbox: "allow-scripts",
        }),
      ).to.equal("2");
    });

    it("defaults to v2 when no distinguishing features", () => {
      expect(detectMetaframeVersion({ metadata: {} })).to.equal("2");
    });
  });
});

describe("versionless conversion", () => {
  describe("metapage definitions without version", () => {
    it("converts a versionless v2-like definition to current version", async () => {
      const def = {
        metaframes: {
          mf1: { url: "https://example.com" },
        },
      };
      const result = await convertMetapageDefinitionToCurrentVersion(def);
      expect(result.version).to.equal("2");
      expect(result.metaframes.mf1.url).to.equal("https://example.com");
    });

    it("converts a versionless v1-like definition to current version", async () => {
      const def = {
        metaframes: {
          mf1: { url: "https://example.com" },
        },
        meta: { keywords: ["test"], author: "Dion" },
      };
      const result = await convertMetapageDefinitionToCurrentVersion(def);
      expect(result.version).to.equal("2");
      // keywords should be converted to tags
      expect(result.meta?.tags).to.deep.equal(["test"]);
      // author should be converted to authors
      expect(result.meta?.authors).to.deep.equal(["Dion"]);
    });

    it("converts a versionless v0.3-like definition to current version", async () => {
      const def = {
        metaframes: {
          mf1: {
            metaframe: {
              version: "0.3",
              metadata: { title: "Example", author: "Dion" },
              inputs: {},
              outputs: {},
            },
            id: "obsolete",
            url: "https://example.com",
          },
        },
        plugins: ["https://plugin.example.com"],
      };
      const result = await convertMetapageDefinitionToCurrentVersion(def);
      expect(result.version).to.equal("2");
    });
  });

  describe("metaframe definitions without version", () => {
    it("converts a versionless v2-like definition to current version", async () => {
      const def = {
        metadata: { name: "Test", authors: ["Dion"] },
      };
      const result = await convertMetaframeJsonToCurrentVersion(def as any);
      expect(result?.version).to.equal("2");
      expect(result?.metadata?.authors).to.deep.equal(["Dion"]);
    });

    it("converts a versionless v1-like definition to current version", async () => {
      const def = {
        metadata: { name: "Test", author: "Dion" },
      };
      const result = await convertMetaframeJsonToCurrentVersion(def as any);
      expect(result?.version).to.equal("2");
      // author should be converted to authors
      expect(result?.metadata?.authors).to.deep.equal(["Dion"]);
    });
  });
});
