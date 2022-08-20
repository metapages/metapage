import { MetaframeId, MetaframePipeId } from "./core";
import { VersionsMetaframe } from "./versions";
import { MetapageDefinition } from "../v0_3/all";

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
    to: string;
    toType: "search" | "hash" | "path";
  }[];
};

// the metaframe name to get the hash params is "edit"
export type MetaframeEditTypeMetapage = {
  definition: MetapageDefinition;
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
}
