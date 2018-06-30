package js.metapage.v1;

typedef MetaframeMetadata = {
	@:optional var version :String;
	@:optional var title :String;
	@:optional var author :String;
	@:optional var image :String;
	@:optional var descriptionUrl :String;
	@:optional var keywords :Array<String>;
	@:optional var iconUrl :String;
}
