import {
  MetapageDefinitionV02,
  MetapageId,
} from '../v0_2/all.js';

export type Url = string;

export interface MetapageOptions {
	id ?:MetapageId;
	color ?:string;
}

export interface MetapageDefinitionV03 extends MetapageDefinitionV02 {
	// The plugin URLs point to the path containing a MetaframeInstance JSON
	// It's an array because it needs to be sorted, but currently don't allow duplicate plugin URLs
	plugins ?:Url[];
}

export type {
  MetaframeDefinitionV02 as MetaframeDefinitionV03,
  MetaframeId,
  MetaframeInputMap,
  MetaframeInstanceAnonymous,
  MetaframeInstanceV02,
  MetaframeMetadataV02 as MetaframeMetadataV03,
  MetaframePipeDefinition,
  MetaframePipeId,
  MetapageId,
  MetapageInstanceInputs,
  MetapageMetadata as MetapageMetadataV03,
  PipeInput,
  PipeUpdateBlob,
} from '../v0_2/all';
