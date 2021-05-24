import { MetapageId} from '../v0_2/all';
import { MetapageDefinition as V0_2MetapageDefinition } from '../v0_2/all';

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

export { MetapageInstanceInputs } from '../v0_2/all';
export { MetaframeInstance } from '../v0_2/all';
export { PipeUpdateBlob } from '../v0_2/all';
export { PipeInput } from '../v0_2/all';
export { MetaframeInstanceAnonymous } from '../v0_2/all';
export { MetaframeMetadata } from '../v0_2/all';
export { MetapageMetadata } from '../v0_2/all';
export { MetaframeDefinition } from '../v0_2/all';
export { MetaframePipeDefinition } from '../v0_2/all';
export { MetaframeInputMap } from '../v0_2/all';
export { MetapageId } from '../v0_2/all';
export { MetaframeId } from '../v0_2/all';
export { MetaframePipeId } from '../v0_2/all';
