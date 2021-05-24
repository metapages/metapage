import {VersionsMetaframe as Versions} from "../v0_4/versions";

export type MetaframePipeId = string;
export type MetaframeId = string;
export type MetapageId = string;

export interface Pipe {
  source: PipeOutput;
  target: PipeInput;
}

export interface PipeOutput {
  id: MetaframeId;
  name: MetaframePipeId;
}

export interface PipeInput extends PipeOutput {}

export type MetaframeMetadata = {
  version?: string;
  title?: string;
  author?: string;
  image?: string;
  descriptionUrl?: string;
  keywords?: string[];
  iconUrl?: string;
};

export interface MetaframeDefinition {
  version?: Versions;
  inputs?: MetaframePipeDefinition[];
  outputs?: MetaframePipeDefinition[];
  metadata?: MetaframeMetadata;
}

export interface MetapageDefinition {
  id?: MetapageId;
  version: Versions; // Best to require this even if annoying to users.
  iframes: {
    [key: string]: MetaframeInstance
  };
  options?: any;
  pipes?: Pipe[];
  meta?: MetapageMetadata;
  v?: number;
}

export interface MetaframePipeDefinition extends DataBlob {
  name: MetaframePipeId;
}

export interface DataBlob {
  value: any;
  encoding?: DataEncoding; //Default: DataEncoding.utf8
  hash?: string; //Format: "sha256:xzy..." or "md5:xzy..."
  source?: DataSource; //Default: SourceInline
  type?: string; //Used for data typing, arbitrary string, e.g. string/dna, application/json
  // v ?:number; Version, internal use only, for quicker and more reliable updating
}

//https://nodejs.org/api/buffer.html

export enum DataEncoding {
  utf8 = "utf8",
  base64 = "base64",
  json = "json"
}

export enum DataSource {
  SourceUrl = "url",
  SourceInline = "inline" //Default
}

export interface MetaframeInstanceAnonymous {
  url: string;
  metaframe: MetaframeDefinition;
  screenshotUrl?: string;
  updatedAt?: Date;
}

export interface MetaframeInstance extends MetaframeInstanceAnonymous {
  url: string;
  //This is starting data, a way to configure and
  //save metaframe instance state independent of pipes
  //and not part of the actual static definition.
  //They will override the inputs defined in the
  //metaframe:MetaframeDefinition
  inputs?: Array<PipeUpdateBlob>;
  outputs?: Array<PipeUpdateBlob>;
}

export interface PipeUpdateBlob extends DataBlob {
  name: MetaframePipeId;
}

export interface PipeInputBlob extends PipeUpdateBlob {
  iframeId?: MetaframeId;
  parentId?: MetapageId;
}

export interface PipeOutputBlob extends PipeInputBlob {}

export interface MetapageMetadata {
  version?: string;
  layout?: MetapageMetadataLayout;
  name?: string;
}

export enum MetapageVersionLayoutType {
  gridlayout = "gridlayout"
}

export type MetapageMetadataLayout = {
  version?: string;
  layouts?: {
    [key in MetapageVersionLayoutType]: MetapageVersionLayoutGrid
  };
};

export type MetapageVersionLayoutGrid = {
  layout: ReactGridLayoutData[];
};

export type ReactGridLayoutData = {
  i?: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  isDraggable?: boolean;
  isResizable?: boolean;
};
