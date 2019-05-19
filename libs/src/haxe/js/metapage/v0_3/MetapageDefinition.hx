package js.metapage.v0_3;

import js.metapage.v0_2.MetaframeInstance;
import js.metapage.v0_2.MetapageMetadata;
import js.metapage.v0_2.MetapageOptions;

typedef MetapageDefinition = {
	var id :MetapageId;
	@:optional var version :MetapageVersion;
	var metaframes :util.TypedDynamicAccess<MetaframeId, MetaframeInstance>;
	@:optional var options :MetapageOptions;
	@:optional var meta :MetapageMetadata;
	//Internal version (server only)
	@:optional var v :Int;
}
