import {Versions} from "../MetaLibsVersion";

export type MetaframePipeId = string;
export type MetaframeId = string;
export type MetapageId = string;

export type MetaframeInputMap = {
  [key: string]: any
}; // key: MetaframePipeId

export type MetaframePipeDefinition = {
  type?: string;
};

export interface MetapageDefinition {
	id ?:MetapageId;
  // Best to require this even if annoying to users. It's like the docker-compose.yml version. Human velocity changes (slow but steady)
	version :Versions;
	metaframes :{ [key: string]: MetaframeInstance; } ;
	// The plugin URLs point to the path containing a MetaframeInstance JSON
	// It's an array because it needs to be sorted, but currently don't allow duplicate plugin URLs
	meta ?:MetapageMetadata;
}

export interface MetaframeDefinition {
  version?: Versions;
  inputs?: {
    [key: string]: MetaframePipeDefinition
  }; // <MetaframePipeId, MetaframePipeDefinition>
  outputs?: {
    [key: string]: MetaframePipeDefinition
  }; // <MetaframePipeId, MetaframePipeDefinition>
  metadata: MetaframeMetadata;
}

export type MetapageMetadata = {
  name?: string;
  description?:string;
  // the idea is there *could* be different ways of displaying the metapage, so we store the preferred ways here
  // you cannot really bake in which one is the "default" since that is not under our control nor should we care
  // but we can have preferences
  layouts?: {
    [key in string]: any
  };
  // layout?: MetapageMetadataLayout;
};

//Just needed for the metaframe editor, it can be
//editing metaframes that are not yet instances,
//so don't have e.g. ids
//Also is the primary document stored in the db

export interface MetaframeInstanceAnonymous {
  url: string;
  metaframe: MetaframeDefinition;
  screenshotUrl?: string;
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

export interface MetaframeInstance extends MetaframeInstanceAnonymous {
  //This id is only used when the metaframe is part of
  //a metapage, i.e. it's an "instance" of the base metaframe
  id: MetaframeId;
  // Defines the inputs pipes from other metaframes
  inputs?: PipeInput[];
  //This is starting data, a way to configure and
  //save metaframe instance state independent of pipes
  //and not part of the actual static definition.
  //They will override the inputs defined in the
  //metaframe:MetaframeDefinition
  state?: PipeUpdateBlob[];
  //TODO I don't think we should save this state
  outputs?: PipeUpdateBlob[];
}

export type MetaframeMetadata = {
  version?: string;
  title?: string;
  author?: string;
  image?: string;
  descriptionUrl?: string;
  keywords?: string[];
  iconUrl?: string;
};

export interface MetapageInstanceInputs { [key: string]: MetaframeInputMap; } ;
