package js.metapage.v0_0_1;

typedef MetapageMetadataLayout = {
	@:optional var version :String;
	@:optional var layouts :TypedDynamicAccess<MetapageVersionLayoutType, MetapageVersionLayoutGrid>;
}
