package js.metapage.v0_1_0;

typedef MetaframeDefinition = {
	@:optional var version :MetaframeDefinitionVersion;
	@:optional var inputs :JSMap<MetaframePipeId, MetaframePipeDefinition>;
	@:optional var outputs :JSMap<MetaframePipeId, MetaframePipeDefinition>;
	@:optional var metadata :MetaframeMetadata;
}