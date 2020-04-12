package js.metapage.v0_3;

typedef MetapageDefinition = {
	@:optional var id :MetapageId;
	var version :MetaLibsVersion; // Best to require this even if annoying to users.
	var metaframes :util.TypedanyAccess<MetaframeId, MetaframeInstance>;
	// The plugin URLs point to the path containing a MetaframeInstance JSON
	// It's an array because it needs to be sorted, but currently don't allow duplicate plugin URLs
	@:optional var plugins :Array<Url>;
	@:optional var meta :MetapageMetadata;
}
