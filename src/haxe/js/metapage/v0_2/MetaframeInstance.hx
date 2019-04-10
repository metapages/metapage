package js.metapage.v0_2;

//Just needed for the metaframe editor, it can be
//editing metaframes that are not yet instances,
//so don't have e.g. ids
//Also is the primary document stored in the db
typedef MetaframeInstanceAnonymous = {
	var url :String;
	var metaframe :MetaframeDefinition;
	@:optional var screenshotUrl :String;
	@:optional var updatedAt :Date;
}

typedef MetaframeInstance = { >MetaframeInstanceAnonymous,
	//This id is only used when the metaframe is part of
	//a metapage, i.e. it's an "instance" of the base metaframe
	var id :MetaframeId;
	// Defines the inputs pipes from other metaframes
	@:optional var inputs :Array<PipeInput>;
	//This is starting data, a way to configure and
	//save metaframe instance state independent of pipes
	//and not part of the actual static definition.
	//They will override the inputs defined in the
	//metaframe:MetaframeDefinition
	@:optional var state :Array<PipeUpdateBlob>;
	//TODO I don't think we should save this state
	@:optional var outputs :Array<PipeUpdateBlob>;
}