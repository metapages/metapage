package metapage;

typedef MetaframePipeDefinitionV1 = {
	var pipeId :MetaframePipeId;
	@:optional var type :String;
	@:optional var value :Dynamic;
	@:optional var encoding :MetaframePipeEncoding;
}
