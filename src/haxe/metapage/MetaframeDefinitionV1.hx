package metapage;

typedef MetaframeDefinitionV1 = {
	@:optional var version :MetaframeDefinitionVersion;
	@:optional var inputs :Array<MetaframePipeDefinitionV1>;
	@:optional var outputs :Array<MetaframePipeDefinitionV1>;
	@:optional var metadata :MetaframeMetadataV1;
}
