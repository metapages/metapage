import { MetaframeId, MetaframePipeId } from './core';
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

export type MetaframeMetadata = {
    version?: string;
    title?: string;
    author?: string;
    image?: string;
    descriptionUrl?: string;
    keywords?: string[];
    iconUrl?: string;
};

export interface MetaframeDefinition {
    version?: VersionsMetaframe;
    inputs?: {
        [key: string]: MetaframePipeDefinition
    }; // <MetaframePipeId, MetaframePipeDefinition>
    outputs?: {
        [key: string]: MetaframePipeDefinition
    }; // <MetaframePipeId, MetaframePipeDefinition>
    metadata: MetaframeMetadata;
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Feature_Policy/Using_Feature_Policy#the_iframe_allow_attribute
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Feature-Policy#directives
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
    // Defines the inputs pipes from other metaframes
    inputs?: PipeInput[];
}
