import { VersionsMetaframe as Versions } from "../v0_4/versions";
export type MetaframePipeId = string;
export type MetaframeId = string;
export type MetapageId = string;
export interface Pipe {
    source: PipeOutput;
    target: PipeInput;
}
export interface PipeOutput {
    id: MetaframeId;
    name: MetaframePipeId;
}
export interface PipeInput extends PipeOutput {
}
export type MetaframeMetadata = {
    version?: string;
    name?: string;
    author?: string;
    image?: string;
    description?: string;
    keywords?: string[];
    icon?: string;
};
export interface MetaframeDefinition {
    version?: Versions;
    inputs?: MetaframePipeDefinition[];
    outputs?: MetaframePipeDefinition[];
    metadata?: MetaframeMetadata;
}
export interface MetapageDefinition {
    id?: MetapageId;
    version: Versions;
    iframes: {
        [key: string]: MetaframeInstance;
    };
    options?: any;
    pipes?: Pipe[];
    meta?: MetapageMetadata;
    v?: number;
}
export interface MetaframePipeDefinition extends DataBlob {
    name: MetaframePipeId;
}
export interface DataBlob {
    value: any;
    encoding?: DataEncoding;
    hash?: string;
    source?: DataSource;
    type?: string;
}
export declare enum DataEncoding {
    utf8 = "utf8",
    base64 = "base64",
    json = "json"
}
export declare enum DataSource {
    SourceUrl = "url",
    SourceInline = "inline"
}
export interface MetaframeInstanceAnonymous {
    url: string;
    metaframe: MetaframeDefinition;
    screenshotUrl?: string;
    updatedAt?: Date;
}
export interface MetaframeInstance extends MetaframeInstanceAnonymous {
    id: MetaframeId;
    inputs?: Array<PipeUpdateBlob>;
    outputs?: Array<PipeUpdateBlob>;
}
export interface PipeUpdateBlob extends DataBlob {
    name: MetaframePipeId;
}
export interface PipeInputBlob extends PipeUpdateBlob {
    iframeId?: MetaframeId;
    parentId?: MetapageId;
}
export interface PipeOutputBlob extends PipeInputBlob {
}
export interface MetapageMetadata {
    version?: string;
    layout?: MetapageMetadataLayout;
    name?: string;
}
export declare enum MetapageVersionLayoutType {
    gridlayout = "gridlayout"
}
export type MetapageMetadataLayout = {
    version?: string;
    layouts?: {
        [key in MetapageVersionLayoutType]: MetapageVersionLayoutGrid;
    };
};
export type MetapageVersionLayoutGrid = {
    layout: ReactGridLayoutData[];
};
export type ReactGridLayoutData = {
    i?: string;
    x?: number;
    y?: number;
    w?: number;
    h?: number;
    minW?: number;
    maxW?: number;
    minH?: number;
    maxH?: number;
    isDraggable?: boolean;
    isResizable?: boolean;
};
//# sourceMappingURL=all.d.ts.map