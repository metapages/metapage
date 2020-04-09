package js.metapage.v0_0_1;

typedef MetapageDefinition = {
	var id :MetapageId;
	@:optional var version :MetaLibsVersion;
	var iframes :util.TypedDynamicAccess<MetaframeId, MetaframeInstance>;
	@:optional var options :MetapageOptions;
	@:optional var pipes :Array<Pipe>;
	@:optional var meta :MetapageMetadata;
	//Internal version (server only)
	@:optional var v :Int;
}
