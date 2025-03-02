import { VersionsMetaframe } from '../versions.js';
import { MetaframePipeDefinition } from '../v0_4/index.js';
import { MetaframeOperationsV1 } from '../v1/metaframe.js';

export type MetaframeMetadataV2 = {
  name?: string;
  description?: string;
  authors?: string[];
  image?: string;
  tags?: string[];
  operations?: MetaframeOperationsV1;
};

export interface MetaframeDefinitionV2 {
  version: VersionsMetaframe;
  inputs?: {
    [key: string]: MetaframePipeDefinition;
  }; // <MetaframePipeId, MetaframePipeDefinition>
  outputs?: {
    [key: string]: MetaframePipeDefinition;
  }; // <MetaframePipeId, MetaframePipeDefinition>
  metadata: MetaframeMetadataV2;
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Feature_Policy/Using_Feature_Policy#the_iframe_allow_attribute
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Feature-Policy#directives
  allow?: string;
  // Set or override allowed features for the iframe
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#sandbox
  sandbox?: string;
}

