package js.metapage.v1;

typedef MetapageDefinition = {
	@:optional var version :MetapageVersion;
	var iframes :util.TypedDynamicAccess<MetaframeId, MetapageIFrame>;
	@:optional var options :MetapageOptions;
	@:optional var pipes :Array<Pipe>;
	@:optional var id :MetapageId;
	@:optional var meta :MetapageMetadata;
}
