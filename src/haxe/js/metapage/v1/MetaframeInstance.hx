package js.metapage.v1;

typedef MetaframeInstance = {
	var id :MetaframeId;
	var url :String;
	var metaframe :MetaframeDefinition;
	@:optional var screenshotUrl :String;
	@:optional var updatedAt :Date;
	//This is starting data, a way to configure and
	//save metaframe instance state independent of pipes
	//and not part of the actual static definition.
	//They will override the inputs defined in the
	//metaframe:MetaframeDefinition
	@:optional var inputs :Array<PipeUpdateBlob>;
}