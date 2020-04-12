package js.metapage.v0_1_0;

typedef MetapageMetadataLayout = {
	@:optional var version :String;
	@:optional var layouts :TypedanyAccess<MetapageVersionLayoutType, MetapageVersionLayoutGrid>;
}
