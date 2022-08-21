import { VersionsMetapage } from "./versions";
import { MetapageId, Url } from "./core";
import { MetaframeInstance } from "./metaframe";

export interface MetapageOptions {
  id?: MetapageId;
  color?: string;
}

export type MetapageMetadata = {
  name?: string;
  description?: string;
  author?: string;
  image?: string;
  keywords?: string[];
  // the idea is there *could* be different ways of displaying the metapage, so we store the preferred ways here
  // you cannot really bake in which one is the "default" since that is not under our control nor should we care
  // but we can have preferences
  layouts?: {
    [key in string]: any;
  };
  // layout?: MetapageMetadataLayout;
};

export interface MetapageDefinitionV3 {
  id?: MetapageId;
  // Best to require this even if annoying to users. It's like the docker-compose.yml version. Human velocity changes (slow but steady)
  version: VersionsMetapage;
  metaframes: { [key: string]: MetaframeInstance };
  // The plugin URLs point to the path containing a MetaframeInstance JSON
  // It's an array because it needs to be sorted, but currently don't allow duplicate plugin URLs
  meta?: MetapageMetadata;
  // The plugin URLs point to the path containing a MetaframeInstance JSON
  // It's an array because it needs to be sorted, but currently don't allow duplicate plugin URLs
  plugins?: Url[];
}

export type MetaframeInputMap = {
  [key: string]: any;
}; // key: MetaframePipeId

export interface MetapageInstanceInputs {
  [key: string]: MetaframeInputMap;
}
