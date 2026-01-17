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
