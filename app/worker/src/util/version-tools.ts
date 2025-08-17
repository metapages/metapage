import { compare, parse } from "@std/semver";

export const getAllMetapageVersions = async (): Promise<string[]> => {
  try {
    const response = await fetch(
      "https://registry.npmjs.org/@metapages/metapage"
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const versions = Object.entries(data.versions)
      .filter(([_, versionData]: [string, any]) => !versionData.deprecated)
      .filter(([version, _]) => compare(parse(version), parse("1.8.1")) >= 0)
      .map(([version, _]) => version);
    return versions.sort((a, b) => {
      const [aMajor, aMinor, aPatch] = a.split(".").map(Number);
      const [bMajor, bMinor, bPatch] = b.split(".").map(Number);

      if (aMajor !== bMajor) return bMajor - aMajor;
      if (aMinor !== bMinor) return bMinor - aMinor;
      return bPatch - aPatch;
    });
  } catch (error) {
    console.error("Error fetching @metapages/metapage versions:", error);
    return [];
  }
};

export const getMetapageImportUrl = (
  version: string,
  debug: boolean = false
): string => {
  let metapageScriptSrc = "";
  if (version === "latest") {
    metapageScriptSrc = `/metapage/index.js`;
  } else {
    // The passed in semver version string can be appended with "-<stuff>"
    const versionForUrl = version.split("-")[0];
    // console.log('versionForUrl', versionForUrl);
    if (compare(parse(versionForUrl), parse("0.16.0")) >= 0) {
      metapageScriptSrc = `https://cdn.jsdelivr.net/npm/@metapages/metapage@${versionForUrl}`;
    } else if (compare(parse(versionForUrl), parse("0.11.0")) >= 0) {
      metapageScriptSrc = `https://cdn.jsdelivr.net/npm/@metapages/metapage@${versionForUrl}/dist/browser/metaframe/index.js`;
    } else if (compare(parse(versionForUrl), parse("0.8.0")) >= 0) {
      metapageScriptSrc = `https://cdn.jsdelivr.net/npm/@metapages/metapage@${versionForUrl}/browser/metaframe/index.js`;
    } else if (compare(parse(versionForUrl), parse("0.5.5")) === 0) {
      metapageScriptSrc = `https://cdn.jsdelivr.net/npm/@metapages/metapage-backup@${versionForUrl}/browser/metaframe/index.js`;
    } else if (compare(parse(versionForUrl), parse("0.5.0")) >= 0) {
      metapageScriptSrc = `https://cdn.jsdelivr.net/npm/@metapages/metapage@${versionForUrl}/browser/metaframe/index.js`;
    } else if (compare(parse(versionForUrl), parse("0.4.100")) >= 0) {
      metapageScriptSrc = `https://cdn.jsdelivr.net/npm/metaframe@${versionForUrl}/browser/index.js`;
    } else {
      metapageScriptSrc = `https://cdn.jsdelivr.net/npm/metaframe@${versionForUrl}/browser${
        debug ? "" : ".min"
      }.js`;
    }
  }
  return metapageScriptSrc;
};
