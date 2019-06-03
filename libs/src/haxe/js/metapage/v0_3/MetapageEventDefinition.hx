package js.metapage.v0_3;

@:enum
abstract MetapageEventStateType(String) to String {
  var all   = "all";
  var delta = "delta";
}

typedef MetapageEventDefinition = {
	var definition :MetapageDefinition;
  var metaframes :JSMap<MetaframeId, IFrameRpcClient>;
  @:optional var plugins :JSMap<Url, IFrameRpcClient>;
}
