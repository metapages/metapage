import { VersionsMetaframe } from '../versions.js';
import { MetapageDefinitionV1 } from './metapage.js';
import { MetaframePipeDefinition } from '../v0_4/index.js';

export type MetaframeEditTypeMetaframeV1 = {
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

export type MetaframeMetadataV1 = {
  name?: string;
  description?: string;
  author?: string;
  image?: string;
  tags?: string[];
  operations?: MetaframeOperationsV1;
};

export interface MetaframeDefinitionV1 {
  version: VersionsMetaframe;
  inputs?: {
    [key: string]: MetaframePipeDefinition;
  }; // <MetaframePipeId, MetaframePipeDefinition>
  outputs?: {
    [key: string]: MetaframePipeDefinition;
  }; // <MetaframePipeId, MetaframePipeDefinition>
  metadata: MetaframeMetadataV1;
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Feature_Policy/Using_Feature_Policy#the_iframe_allow_attribute
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Feature-Policy#directives
  allow?: string;
}

export type MetaframeEditTypesV1 = "metapage" | "url";

export interface MetaframeEditTypeUrlV1Param {
  // from is the url used inside the edit panel, it defaults to the metaframe URL
  // but also you can set a completely different URL
  // this is a hash param, it's the only param we can get from a URL
  // since we only have hash param updates inside metapages (and these run in metapages)
  from: string;
  to?: string; // default (same as from)
  toType?: "search" | "hash"; // default is hash
}

export type MetaframeEditTypeUrlV1 = {
  type: MetaframeEditTypesV1; // url
  url: string;
  // from the target metaframe to the edit metaframe
  // we can only get hash params from the edit metaframe but those
  // might map to path or search elements on the target metaframe
  params?: MetaframeEditTypeUrlV1Param[];
};

export interface MetaframeEditTypeMetapageV1Param {
  // the key of the source metaframe that will supply a hash param to the edit metaframe
  metaframe?: string;
  from: string; // this is a hash param, it's the only param we can get from a metaframe
  to?: string; // default (same as from)
}

// the metaframe name to get the hash params is "edit"
export interface MetaframeEditTypeMetapageV1 {
  type: MetaframeEditTypesV1; // "metapage"
  metapage: MetapageDefinitionV1;
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
  params?: MetaframeEditTypeMetapageV1Param[];
}

export type MetaframeOperationTypeV1 =
  | MetaframeEditTypeUrlV1
  | MetaframeEditTypeMetapageV1;

export interface MetaframeOperationsV1 {
  create?: MetaframeOperationTypeV1;
  edit?: MetaframeOperationTypeV1;
  view?: MetaframeOperationTypeV1;
}

