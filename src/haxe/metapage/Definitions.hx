package metapage;

import haxe.extern.EitherType;

import util.TypedDynamicAccess;

typedef Function=Dynamic;

typedef PipeOutputBlob=PipeInputBlob;

typedef PipeOutput = {
	var id :MetaframeId;
	var pipe :MetaframePipeId;
}

typedef PipeInput = {
	var id :MetaframeId;
	var pipe :MetaframePipeId;
}

typedef Pipe = {
	var from :PipeOutput;
	var to :PipeInput;
}

typedef MetapageIFrameV1 = {
	var url :String;
	// var in :DynamicAccess<PipeDefinition>;
	// var out :DynamicAccess<PipeDefinition>;
}

typedef MetaframeOptionsV1 = {
	@:optional var debug :Bool;
	@:optional var showBanner :Bool;
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

@:enum
abstract MetaframePipeEncoding(String) {
	var Utf8 = "utf8";
	var Base64 = "base64";
}
