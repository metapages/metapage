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

@:enum
abstract MetapageVersion(String) from String {
	var V1 = "1";
}

typedef MetapageDefinition = {
	@:optional var version :MetapageVersion;
	var iframes :DynamicAccess<MetapageIFrame>;
	@:optional var options :MetapageOptions;
	@:optional var pipes :Array<Pipe>;
}

@:enum
abstract MetaframeVersion(String) from String {
	var V1 = "1";
}

@:enum
abstract MetaframePipeEncoding(String) {
	var Utf8 = "utf8";
	var Base64 = "base64";
}

typedef MetaframePipeDefinition = {
	var name :String;
	@:optional var type :String;
	@:optional var value :Dynamic;
	@:optional var encoding :MetaframePipeEncoding;
}

typedef MetaframeMetadata = {
	@:optional var version :String;
	@:optional var title :String;
	@:optional var author :String;
	@:optional var image :String;
	@:optional var descriptionUrl :String;
}

typedef MetaframeDefinition = {
	@:optional var version :MetaframeVersion;
	@:optional var inputs :Array<MetaframePipeDefinition>;
	@:optional var outputs :Array<MetaframePipeDefinition>;
	@:optional var metadata :MetaframeMetadata;
}