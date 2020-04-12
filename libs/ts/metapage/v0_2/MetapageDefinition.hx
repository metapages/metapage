package js.metapage.v0_2;

typedef MetapageDefinition = {
	var id :MetapageId;
	@:optional var version :MetaLibsVersion;
	var metaframes :util.TypedanyAccess<MetaframeId, MetaframeInstance>;
	@:optional var options :MetapageOptions;
	@:optional var meta :MetapageMetadata;
	//Internal version (server only)
	@:optional var v :Int;
}
