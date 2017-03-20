package metapage;

typedef Function=Dynamic;

typedef PipeUpdateBlob = {
  var name :String;
  var value :Dynamic;
}

typedef PipeInputBlob = {>PipeUpdateBlob,
	@:optional var iframeId :String;
	@:optional var parentId :String;
}

typedef PipeOutputBlob=PipeInputBlob;

typedef PipeOutput = {
	var id :String;
	var pipe :String;
}

typedef PipeInput = {
	var id :String;
	var pipe :String;
}

typedef Pipe = {
	var from :PipeOutput;
	var to :PipeInput;
}

@:enum
abstract PipeDataLocation(String) to String {
	var Inline = "inline";
	var Url = "url";
}

typedef PipeDefinition = {
	var type :String;
	@:optional var location :PipeDataLocation;
	@:optional var value :Dynamic;
}

typedef MetapageIFrame = {
	var url :String;
	// var in :DynamicAccess<PipeDefinition>;
	// var out :DynamicAccess<PipeDefinition>;
}

typedef MetaframeOptions = {
	var debug :Bool;
	var showBanner :Bool;
}

typedef MetapageOptions = {
	var debug :Bool;
	var color :String;
}

typedef MetapageDefinition = {
	var version :String;
	var iframes :DynamicAccess<MetapageIFrame>;
	@:optional var options :MetapageOptions;
	@:optional var pipes :Array<Pipe>;
}