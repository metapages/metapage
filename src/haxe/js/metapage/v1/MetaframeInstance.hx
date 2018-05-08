package js.metapage.v1;

//Just needed for the metaframe editor, it can be
//editing metaframes that are not yet instances,
//so don't have e.g. ids
typedef MetaframeInstanceAnonymous = {
	var url :String;
	var metaframe :MetaframeDefinition;
	//This is starting data, a way to configure and
	//save metaframe instance state independent of pipes
	//and not part of the actual static definition.
	//They will override the inputs defined in the
	//metaframe:MetaframeDefinition
	@:optional var inputs :Array<PipeUpdateBlob>;
	@:optional var outputs :Array<PipeUpdateBlob>;
}

typedef MetaframeInstance = { >MetaframeInstanceAnonymous,
	var id :MetaframeId;
	@:optional var screenshotUrl :String;
	@:optional var updatedAt :Date;
}