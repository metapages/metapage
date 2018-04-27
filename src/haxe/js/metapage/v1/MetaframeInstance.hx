package js.metapage.v1;

typedef MetaframeInstance = {
	var id :MetaframeId;
	var url :String;
	var metaframe :MetaframeDefinition;
	@:optional var screenshotUrl :String;
	@:optional var updatedAt :Date;
}