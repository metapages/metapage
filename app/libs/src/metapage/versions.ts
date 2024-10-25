// There used to be a single version, but there's no reason to upgrade both versions
// simultaneously. Same versions are an ideal, but forcing it is also bad

export const MetaframeVersionsAll = ["0.3", "0.4", "0.5", "0.6", "1"] as const;
// Create the type from the array
export type VersionsMetaframe = (typeof MetaframeVersionsAll)[number];

export const MetapageVersionsAll  = ["0.2", "0.3", "1"] as const;
// Create the type from the array
export type VersionsMetapage = (typeof MetapageVersionsAll)[number];

export const MetaframeVersionCurrent :VersionsMetaframe = "1";
export const MetapageVersionCurrent :VersionsMetapage = "1";
