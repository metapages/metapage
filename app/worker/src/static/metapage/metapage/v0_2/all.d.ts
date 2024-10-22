import { VersionsMetapage as Versions } from "../v0_4/versions";
export type MetaframePipeId = string;
export type MetaframeId = string;
export type MetapageId = string;
export type MetaframeInputMap = {
    [key: string]: any;
};
export type MetaframePipeDefinition = {
    type?: string;
};
export interface MetapageDefinition {
    id?: MetapageId;
    version: Versions;
    metaframes: {
        [key: string]: MetaframeInstance;
    };
    meta?: MetapageMetadata;
}
export interface MetaframeDefinition {
    version?: Versions;
    inputs?: {
        [key: string]: MetaframePipeDefinition;
    };
    outputs?: {
        [key: string]: MetaframePipeDefinition;
    };
    metadata: MetaframeMetadata;
}
export type MetapageMetadata = {
    name?: string;
    description?: string;
    layouts?: {
        [key in string]: any;
    };
};
export interface MetaframeInstanceAnonymous {
    url: string;
    metaframe: MetaframeDefinition;
    screenshotUrl?: string;
}
export interface PipeInput {
    metaframe: MetaframeId;
    source: MetaframePipeId;
    target: MetaframePipeId;
}
export interface PipeUpdateBlob {
    name: MetaframePipeId;
    value: any;
}
export interface MetaframeInstance extends MetaframeInstanceAnonymous {
    id: MetaframeId;
    inputs?: PipeInput[];
    state?: PipeUpdateBlob[];
    outputs?: PipeUpdateBlob[];
}
export type MetaframeMetadata = {
    version?: string;
    title?: string;
    author?: string;
    image?: string;
    descriptionUrl?: string;
    keywords?: string[];
    iconUrl?: string;
};
export interface MetapageInstanceInputs {
    [key: string]: MetaframeInputMap;
}
//# sourceMappingURL=all.d.ts.map