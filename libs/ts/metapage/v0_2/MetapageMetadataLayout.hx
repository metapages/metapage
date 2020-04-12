package js.metapage.v0_2;

typedef MetapageMetadataLayout = {
	@:optional var version :String;
	@:optional var layouts :TypedanyAccess<MetapageVersionLayoutType, MetapageVersionLayoutGrid>;
}
