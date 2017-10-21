package metapage;

typedef MetapageDefinitionV1 = {
	@:optional var version :MetapageVersion;
	var iframes :TypedDynamicAccess<MetaframeId, MetapageIFrameV1>;
	@:optional var options :MetapageOptionsV1;
	@:optional var pipes :Array<Pipe>;
	@:optional var id :MetapageId;
	@:optional var meta :MetapageMetadataV1;
}
