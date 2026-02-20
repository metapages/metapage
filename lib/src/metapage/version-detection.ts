import { type VersionsMetapage, type VersionsMetaframe } from "./versions.js";

/**
 * Detects the metapage definition version from its structure.
 * If `version` is already set, returns it directly.
 */
export const detectMetapageVersion = (def: any): VersionsMetapage => {
  if (def?.version) {
    return def.version;
  }

  // v0.2/v0.3: metaframe entries have an embedded `metaframe` property
  const metaframes = def?.metaframes;
  if (metaframes) {
    const firstKey = Object.keys(metaframes)[0];
    if (firstKey && metaframes[firstKey]?.metaframe) {
      // v0.3 has plugins, v0.2 does not
      return def.plugins ? "0.3" : "0.2";
    }
  }

  // v1: meta.keywords (array) or meta.author (string, not array)
  if (def?.meta?.keywords || typeof def?.meta?.author === "string") {
    return "1";
  }

  // Default to current version
  return "2";
};

/**
 * Detects the metaframe definition version from its structure.
 * If `version` is already set, returns it directly.
 */
export const detectMetaframeVersion = (def: any): VersionsMetaframe => {
  if (def?.version) {
    return def.version;
  }

  const metadata = def?.metadata;

  // v0.3/v0.4: has title, descriptionUrl, or iconUrl in metadata
  if (metadata?.title || metadata?.descriptionUrl || metadata?.iconUrl) {
    // v0.4 adds `allow`
    return def.allow ? "0.4" : "0.3";
  }

  // v2: has authors (array), hashParams, or sandbox
  if (Array.isArray(metadata?.authors) || def?.hashParams || def?.sandbox) {
    return "2";
  }

  // v1: has author (string, not array)
  if (typeof metadata?.author === "string") {
    return "1";
  }

  // v0.6: has operations in metadata
  if (metadata?.operations) {
    return "0.6";
  }

  // v0.5: has edit in metadata (older edit field)
  if (metadata?.edit) {
    return "0.5";
  }

  // Default to current version
  return "2";
};
