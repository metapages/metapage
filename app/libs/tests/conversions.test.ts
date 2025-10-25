/// <reference types="@vitest/browser/providers/playwright" />

import {
  convertMetapageDefinitionToCurrentVersion,
  MetapageDefinitionV1,
  MetapageDefinitionV2,
  MetapageVersionCurrent,
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
