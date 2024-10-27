import { VersionsMetapage } from '../versions.js';
import {
  MetapageId,
  Url,
} from './core.js';
import { MetaframeInstance } from './metaframe.js';

export interface MetapageOptions {
  id?: MetapageId;
  color?: string;
}

export type MetapageMetadata = Partial<{
  name: string;
  description: string;
  author: string;
  image: string;
  keywords: string[];
  // the idea is there *could* be different ways of displaying the metapage, so we store the preferred ways here
  // you cannot really bake in which one is the "default" since that is not under our control nor should we care
  // but we can have preferences
  layouts: {
    [key in string]: any;
  };
  // digest of MetapageDefinitionV3 EXCEPT the "meta" field
  // because it's metadata and also contains this hash
  sha256: string;
}>;

export interface MetapageDefinitionV3 {
  id?: MetapageId;
  // Best to require this even if annoying to users. It's like the docker-compose.yml version. Human velocity changes (slow but steady)
  version: VersionsMetapage;
  // the core of this configuration: key to metaframes and their inputs
  metaframes: { [key: string]: MetaframeInstance };
  // meta is optional metadata: name, layouts, tags, etc
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
