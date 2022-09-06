// There used to be a single version, but there's no reason to upgrade both versions
// simultaneously. Same vesions are an ideal, but forcing it is also bad

export enum VersionsMetaframe {
	V0_3 = "0.3",
	V0_4 = "0.4",
	V0_5 = "0.5",
	// Mostly just metadata changes for viewing and editing
	V0_6 = "0.6",
}

export enum VersionsMetapage {
	V0_2 = "0.2",
	V0_3 = "0.3",
}

export const MetaframeVersionsAll = Object.keys(VersionsMetaframe);

export const MetaframeVersionCurrent = VersionsMetaframe.V0_6;

export const MetapageVersionsAll = Object.keys(VersionsMetapage);

export const MetapageVersionCurrent = VersionsMetapage.V0_3;
