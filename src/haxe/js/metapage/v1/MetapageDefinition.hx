package js.metapage.v1;

typedef MetapageDefinition = {
	var id :MetapageId;
	@:optional var version :MetapageVersion;
	var iframes :util.TypedDynamicAccess<MetaframeId, MetaframeInstance>;
	@:optional var options :MetapageOptions;
	@:optional var pipes :Array<Pipe>;
	@:optional var meta :MetapageMetadata;
	//Internal version (server only)
	@:optional var v :Int;
}
