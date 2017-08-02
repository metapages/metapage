package metapage;

import haxe.extern.EitherType;

import util.TypedDynamicAccess;

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
	var LocationInline = "inline";
	var LocationUrl = "url";
}

typedef PipeDefinitionV1 = {
	var type :String;
	@:optional var location :PipeDataLocation;
	@:optional var value :Dynamic;
}

typedef MetapageIFrameV1 = {
	var url :String;
	// var in :DynamicAccess<PipeDefinition>;
	// var out :DynamicAccess<PipeDefinition>;
}

typedef MetaframeOptionsV1 = {
	var debug :Bool;
	var showBanner :Bool;
}

typedef MetapageOptionsV1 = {
	var debug :Bool;
	var color :String;
}

@:enum
abstract MetapageVersion(String) from String {
	var V1 = "1";
}

abstract MetapageId(String) to String
{
  inline public function new(s:String)
  {
    this = s;
  }
}

@:enum
abstract MetapageVersionLayoutType(String) to String {
	var gridlayout = "gridlayout";
}

typedef ReactGridLayoutData = {
	@:optional var i :String;
	@:optional var x :Float;
	@:optional var y :Float;
	@:optional var w :Float;
	@:optional var h :Float;
	@:optional var minW :Float;
	@:optional var maxW :Float;
	@:optional var minH :Float;
	@:optional var maxH :Float;
	@:optional var isDraggable :Bool;
	@:optional var isResizable :Bool;
}

typedef MetapageVersionLayoutGrid = {
	var layout :Array<ReactGridLayoutData>;
}

typedef MetapageMetadataLayoutV1 = {
	@:optional var version :String;
	@:optional var layouts :TypedDynamicAccess<MetapageVersionLayoutType, MetapageVersionLayoutGrid>;
}

typedef MetapageMetadataV1 = {
	@:optional var version :String;
	@:optional var layout :MetapageMetadataLayoutV1;
}

typedef MetapageDefinitionV1 = {
	@:optional var version :MetapageVersion;
	var iframes :DynamicAccess<MetapageIFrameV1>;
	@:optional var options :MetapageOptionsV1;
	@:optional var pipes :Array<Pipe>;
	@:optional var id :MetapageId;
	@:optional var meta :MetapageMetadataV1;
}

@:enum
abstract MetaframeDefinitionVersion(String) from String {
	var V1 = "1";
}

@:enum
abstract MetaframePipeEncoding(String) {
	var Utf8 = "utf8";
	var Base64 = "base64";
}

typedef MetaframePipeDefinitionV1 = {
	var name :String;
	@:optional var type :String;
	@:optional var value :Dynamic;
	@:optional var encoding :MetaframePipeEncoding;
}

typedef MetaframeMetadataV1 = {
	@:optional var version :String;
	@:optional var title :String;
	@:optional var author :String;
	@:optional var image :String;
	@:optional var descriptionUrl :String;
	@:optional var keywords :Array<String>;
	@:optional var iconUrl :String;
}

typedef MetaframeDefinitionV1 = {
	@:optional var version :MetaframeDefinitionVersion;
	@:optional var inputs :Array<MetaframePipeDefinitionV1>;
	@:optional var outputs :Array<MetaframePipeDefinitionV1>;
	@:optional var metadata :MetaframeMetadataV1;
}