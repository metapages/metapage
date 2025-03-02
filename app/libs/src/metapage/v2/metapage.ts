import { VersionsMetapage } from '../versions.js';
import { MetapageId } from '../core.js';
import { MetaframeInstance } from '../v0_4/index.js';

export type MetapageMetadataV2 = Partial<{
  name: string;
  description: string;
  authors: string[];
  image: string;
  tags: string[];
  // the idea is there *could* be different ways of displaying the metapage, so we store the preferred ways here
  // you cannot really bake in which one is the "default" since that is not under our control nor should we care
  // but we can have preferences
  layouts: {
    [key in string]: any;
  };
}>;

export interface MetapageDefinitionV2 {
  id?: MetapageId;
  // Best to require this even if annoying to users. It's like the docker-compose.yml version. Human velocity changes (slow but steady)
  version: VersionsMetapage;
  // the core of this configuration: key to metaframes and their inputs
  metaframes: { [key: string]: MetaframeInstance };
  // meta is optional metadata: name, layouts, tags, etc
  meta?: MetapageMetadataV2;
}
