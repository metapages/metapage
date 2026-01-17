import { VersionsMetaframe } from "../versions.js";
import { MetaframePipeDefinition } from "../v0_4/index.js";
import { MetaframeOperationsV1 } from "../v1/metaframe.js";

// Hash parameter types
export type HashParamType =
  | "string"
  | "stringBase64"
  | "boolean"
  | "json"
  | "File|Blob"
  | "number";

export interface HashParamDefinition {
  type?: HashParamType;
  description?: string; // For humans or LLMs
  label?: string; // Short label
  value?: any; // Default value
  allowedValues?: any[]; // Allowed values
  defaultValue?: any; // Default value
}

export type HashParamsObject = {
  [key: string]: HashParamDefinition;
};

// Union type for raw definitions (before normalization)
export type HashParamsRaw = string[] | HashParamsObject;

export type MetaframeMetadataV2 = {
  name?: string;
  description?: string;
  authors?: string[];
  image?: string;
  tags?: string[];
  // we should disable, very useful, but too complex for now
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
  // Hash parameters configuration.
  // Accepts both legacy array format (string[]) and new object format (HashParamsObject).
  // When fetched via helper methods, array format is normalized to object format.
  hashParams?: HashParamsRaw;
}
