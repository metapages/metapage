import {Versions} from '../MetaLibsVersion';
import {MetaframePipeDefinition, MetaframeInstance, MetaframePipeId, MetaframeInputMap, MetapageId, MetapageMetadata, MetaframeMetadata} from '../v0_2/all';
import { MetapageDefinition as V0_2MetapageDefinition } from 'v0_2/all';
export {Versions, CurrentVersion, AllVersions} from '../MetaLibsVersion';

export type Url=string;

export interface MetapageOptions {
	id ?:MetapageId;
	color ?:string;
}

export interface MetapageDefinition extends V0_2MetapageDefinition {
	// The plugin URLs point to the path containing a MetaframeInstance JSON
	// It's an array because it needs to be sorted, but currently don't allow duplicate plugin URLs
	plugins ?:Url[];
}



// export MetapageInstanceInputs = { [key: string]: MetaframeInputMap; };//<MetaframeId, MetaframeInputMap>;


export { MetapageInstanceInputs } from 'v0_2/all';
export { ReactGridLayoutData } from 'v0_2/all';
export { MetapageVersionLayoutGrid } from 'v0_2/all';
export { MetapageMetadataLayout } from 'v0_2/all';
export { MetapageVersionLayoutType } from 'v0_2/all';
export { MetaframeInstance } from 'v0_2/all';
export { PipeUpdateBlob } from 'v0_2/all';
export { PipeInput } from 'v0_2/all';
export { MetaframeInstanceAnonymous } from 'v0_2/all';
export { MetaframeMetadata } from 'v0_2/all';
export { MetapageMetadata } from 'v0_2/all';
export { MetaframeDefinition } from 'v0_2/all';
export { MetaframePipeDefinition } from 'v0_2/all';
export { MetaframeInputMap } from 'v0_2/all';
export { MetapageId } from 'v0_2/all';
export { MetaframeId } from 'v0_2/all';
export { MetaframePipeId } from 'v0_2/all';
