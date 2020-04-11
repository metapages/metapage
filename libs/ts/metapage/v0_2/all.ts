import {Versions} from '../MetaLibsVersion';

import { MetaframePipeId, MetaframeId, MetaframeMetadata, MetapageMetadataLayout } from 'v0_0_1/all';

export { MetaframePipeId } from 'v0_0_1/all';
export { MetaframeId } from 'v0_0_1/all';
export { MetapageId } from 'v0_0_1/all';


export type MetaframeInputMap={ [key: string]: any; } // key: MetaframePipeId

export type MetaframePipeDefinition = {
	type ?:string;
}

export interface MetaframeDefinition {
    version ?:Versions;
    inputs ?:{ [key: string]: MetaframePipeDefinition; } // <MetaframePipeId, MetaframePipeDefinition>
    outputs ?:{ [key: string]: MetaframePipeDefinition; } // <MetaframePipeId, MetaframePipeDefinition>
	metadata :MetaframeMetadata;
}

export type MetapageMetadata = {
	version ?:string;
	layout ?:MetapageMetadataLayout;
	name ?:string;
}

export { MetaframeMetadata } from 'v0_0_1/all';


//Just needed for the metaframe editor, it can be
//editing metaframes that are not yet instances,
//so don't have e.g. ids
//Also is the primary document stored in the db


export interface MetaframeInstanceAnonymous {
	url :string;
	metaframe :MetaframeDefinition;
	screenshotUrl ?:string;
	// updatedAt :?Date;
}

export interface PipeInput {
	metaframe :MetaframeId;
	source :MetaframePipeId;
    target :MetaframePipeId;
}

export interface PipeUpdateBlob {
    name : MetaframePipeId;
    value: any;
  }


export interface MetaframeInstance extends MetaframeInstanceAnonymous {
	//This id is only used when the metaframe is part of
	//a metapage, i.e. it's an "instance" of the base metaframe
	id :MetaframeId;
	// Defines the inputs pipes from other metaframes
	inputs ?:PipeInput[];
	//This is starting data, a way to configure and
	//save metaframe instance state independent of pipes
	//and not part of the actual static definition.
	//They will override the inputs defined in the
	//metaframe:MetaframeDefinition
	state ?:PipeUpdateBlob[];
	//TODO I don't think we should save this state
	outputs ?:PipeUpdateBlob[];
}

export { MetapageVersionLayoutType } from 'v0_0_1/all';
export { MetapageMetadataLayout } from 'v0_0_1/all';
export { MetapageVersionLayoutGrid } from 'v0_0_1/all';
export { ReactGridLayoutData } from 'v0_0_1/all';
