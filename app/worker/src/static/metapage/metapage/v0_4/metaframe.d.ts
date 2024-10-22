import { MetaframeId, MetaframePipeId } from './core';
import { MetapageDefinitionV3 } from './metapage';
import { VersionsMetaframe } from './versions';
export interface PipeInput {
    metaframe: MetaframeId;
    source: MetaframePipeId;
    target: MetaframePipeId;
}
export interface PipeUpdateBlob {
    name: MetaframePipeId;
    value: any;
}
export type MetaframePipeDefinition = {
    type?: string;
};
export type MetaframeEditType = "metapage" | "metaframe";
export type MetaframeEditTypeMetaframe = {
    url: string;
    params?: {
        from: string;
        to?: string;
        toType?: "search" | "hash" | "path";
    }[];
};
export type MetaframeEditTypeMetapage = {
    definition: MetapageDefinitionV3;
    key?: string;
};
export type MetaframeMetadataV4 = {
    version?: string;
    title?: string;
    author?: string;
    image?: string;
    descriptionUrl?: string;
    keywords?: string[];
    iconUrl?: string;
};
export type MetaframeMetadataV5 = {
    name?: string;
    description?: string;
    author?: string;
    image?: string;
    tags?: string[];
    edit?: {
        type: MetaframeEditType;
        value: MetaframeEditTypeMetaframe | MetaframeEditTypeMetapage;
    };
};
export interface MetaframeDefinitionV4 {
    version?: VersionsMetaframe;
    inputs?: {
        [key: string]: MetaframePipeDefinition;
    };
    outputs?: {
        [key: string]: MetaframePipeDefinition;
    };
    metadata: MetaframeMetadataV4;
    allow?: string;
}
export interface MetaframeDefinitionV5 {
    version: VersionsMetaframe;
    inputs?: {
        [key: string]: MetaframePipeDefinition;
    };
    outputs?: {
        [key: string]: MetaframePipeDefinition;
    };
    metadata?: MetaframeMetadataV5;
    allow?: string;
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
export interface MetaframeInstance {
    url: string;
    inputs?: PipeInput[];
    allow?: string;
}
export interface MetaframeDefinitionV6 {
    version: VersionsMetaframe;
    inputs?: {
        [key: string]: MetaframePipeDefinition;
    };
    outputs?: {
        [key: string]: MetaframePipeDefinition;
    };
    metadata?: MetaframeMetadataV6;
    allow?: string;
}
export type MetaframeEditTypesV6 = "metapage" | "url";
export interface MetaframeEditTypeUrlV6Param {
    from: string;
    to?: string;
    toType?: "search" | "hash";
}
export type MetaframeEditTypeUrlV6 = {
    type: MetaframeEditTypesV6;
    url: string;
    params?: MetaframeEditTypeUrlV6Param[];
};
export interface MetaframeEditTypeMetapageV6Param {
    metaframe?: string;
    from: string;
    to?: string;
}
export interface MetaframeEditTypeMetapageV6 {
    type: MetaframeEditTypesV6;
    metapage: MetapageDefinitionV3;
    metaframe: string;
    params?: MetaframeEditTypeMetapageV6Param[];
}
export type MetaframeOperationTypeV6 = MetaframeEditTypeUrlV6 | MetaframeEditTypeMetapageV6;
export interface MetaframeOperationsV6 {
    create?: MetaframeOperationTypeV6;
    edit?: MetaframeOperationTypeV6;
    view?: MetaframeOperationTypeV6;
}
export type MetaframeMetadataV6 = {
    name?: string;
    description?: string;
    author?: string;
    image?: string;
    tags?: string[];
    operations?: MetaframeOperationsV6;
};
//# sourceMappingURL=metaframe.d.ts.map