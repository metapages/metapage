import { MetapageHashParams } from './Shared';
import { MetaframeDefinitionV4, MetaframeDefinitionV5, MetaframeDefinitionV6, MetaframeId, MetaframeInputMap, MetapageDefinitionV3, MetapageId, VersionsMetapage } from './v0_4';
export declare const convertMetapageDefinitionToCurrentVersion: (def: any | MetapageDefinitionV3) => MetapageDefinitionV3;
export declare const convertMetaframeJsonToCurrentVersion: (m: MetaframeDefinitionV5 | MetaframeDefinitionV4 | MetaframeDefinitionV5 | MetaframeDefinitionV6 | undefined, opts?: {
    errorIfUnknownVersion?: boolean;
}) => MetaframeDefinitionV6 | undefined;
export declare const merge: (current: MetaframeInputMap, newInputs: MetaframeInputMap) => boolean;
export declare const getMatchingVersion: (version: string) => VersionsMetapage;
export declare const getUrlParam: (key: MetapageHashParams) => string | null;
export declare const getUrlParamDebug: () => boolean;
export declare const isDebugFromUrlsParams: () => boolean;
export declare const existsAnyUrlParam: (k: string[]) => boolean;
export declare const generateMetaframeId: (length?: number) => MetaframeId;
export declare const generateMetapageId: (length?: number) => MetapageId;
export declare const generateNonce: (length?: number) => string;
export declare const generateId: (length?: number) => string;
export declare const log: (o: any, color?: string, backgroundColor?: string) => void;
export declare const stringToRgb: (str: string) => string;
export declare const hashCode: (str: string) => number;
export declare const intToRGB: (i: number) => string;
export declare const isPageLoaded: () => boolean;
export declare const pageLoaded: () => Promise<void>;
export declare const metapageAllSha256Hash: (metapage: MetapageDefinitionV3) => Promise<string>;
export declare const metapageOnlyEssentailSha256Hash: (metapage: Pick<MetapageDefinitionV3, "metaframes" | "version" | "plugins">) => Promise<string>;
//# sourceMappingURL=MetapageTools.d.ts.map