import {
  MetaframeId,
  MetaframePipeId,
} from './core';
import { MetapageDefinitionV3 } from './metapage';
import { VersionsMetaframe } from '../versions';

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
  // from the target metaframe to the edit metaframe
  // we can only get hash params from the edit metaframe but those
  // might map to path or search elements on the target metaframe
  params?: {
    from: string; // this is a hash param, it's the only param we can get from a metaframe
    to?: string; // default (same as from)
    toType?: "search" | "hash" | "path"; // default is hash
  }[];
};

// the metaframe name to get the hash params is "edit"
export type MetaframeEditTypeMetapage = {
  definition: MetapageDefinitionV3;
  key?: string; // default is "edit"
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
  }; // <MetaframePipeId, MetaframePipeDefinition>
  outputs?: {
    [key: string]: MetaframePipeDefinition;
  }; // <MetaframePipeId, MetaframePipeDefinition>
  metadata: MetaframeMetadataV4;
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Feature_Policy/Using_Feature_Policy#the_iframe_allow_attribute
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Feature-Policy#directives
  allow?: string;
}

export interface MetaframeDefinitionV5 {
  version: VersionsMetaframe;
  inputs?: {
    [key: string]: MetaframePipeDefinition;
  }; // <MetaframePipeId, MetaframePipeDefinition>
  outputs?: {
    [key: string]: MetaframePipeDefinition;
  }; // <MetaframePipeId, MetaframePipeDefinition>
  metadata?: MetaframeMetadataV5;
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
  // Set or override allowed features for the iframe
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Feature_Policy/Using_Feature_Policy#the_iframe_allow_attribute
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Feature-Policy#directives
  allow?: string;
}

export interface MetaframeDefinitionV6 {
  version: VersionsMetaframe;
  inputs?: {
    [key: string]: MetaframePipeDefinition;
  }; // <MetaframePipeId, MetaframePipeDefinition>
  outputs?: {
    [key: string]: MetaframePipeDefinition;
  }; // <MetaframePipeId, MetaframePipeDefinition>
  metadata?: MetaframeMetadataV6;
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Feature_Policy/Using_Feature_Policy#the_iframe_allow_attribute
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Feature-Policy#directives
  allow?: string;
}

export type MetaframeEditTypesV6 = "metapage" | "url";

export interface MetaframeEditTypeUrlV6Param {
  // from is the url used inside the edit panel, it defaults to the metaframe URL
  // but also you can set a completely different URL
  // this is a hash param, it's the only param we can get from a URL
  // since we only have hash param updates inside metapages (and these run in metapages)
  from: string;
  to?: string; // default (same as from)
  toType?: "search" | "hash"; // default is hash
}

export type MetaframeEditTypeUrlV6 = {
  type: MetaframeEditTypesV6; // url
  url: string;
  // from the target metaframe to the edit metaframe
  // we can only get hash params from the edit metaframe but those
  // might map to path or search elements on the target metaframe
  params?: MetaframeEditTypeUrlV6Param[];
};

export interface MetaframeEditTypeMetapageV6Param {
  // the key of the source metaframe that will supply a hash param to the edit metaframe
  metaframe?: string;
  from: string; // this is a hash param, it's the only param we can get from a metaframe
  to?: string; // default (same as from)
}

// the metaframe name to get the hash params is "edit"
export interface MetaframeEditTypeMetapageV6 {
  type: MetaframeEditTypesV6; // "metapage"
  metapage: MetapageDefinitionV3;
  // key of the metaframe to edit, this gets the target URL
  metaframe: string;
  // if no params is set, then the hash params of the URL are just updated from the metaframe
  // directly.
  // This means that the metaframe is able to edit itself.
  // But if you want other metaframes to assist in editing, then you can set params here.
  // mapping:
  // from the target metaframe to the edit metaframe
  // we can only get hash params from the edit metaframe but those
  // might map to path or search elements on the target metaframe
  params?: MetaframeEditTypeMetapageV6Param[];
}

export type MetaframeOperationTypeV6 =
  | MetaframeEditTypeUrlV6
  | MetaframeEditTypeMetapageV6;

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
