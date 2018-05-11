package js.metapage.v1;

import metapage.*;

typedef Map<K:String,V>=util.TypedDynamicAccess<K,V>;

typedef MetapageInstance = {>MetapageInstanceDefinition, >MetapageInstanceInputs,
	// var id :MetapageId;
	// var metapage :MetapageDefinitionAbstract;
	// var inputs :Map<MetaframeId, Map<MetaframePipeId, DataBlob>>;
	// //Version counter for the metapage definition
	// @:optional var v :Int;
	// //Version counter for the inputs
	// @:optional var vi :Int;
}

typedef MetapageInstanceDefinition = {
	var id :MetapageId;
	var metapage :MetapageDefinitionAbstract;
	// var inputs :Map<MetaframeId, Map<MetaframePipeId, DataBlob>>;
	//Version counter for the metapage definition
	@:optional var vm :Int;
	//Version counter for the inputs
	// @:optional var vi :Int;
}

typedef MetapageInstanceInputs = {
	// var id :MetapageId;
	// var metapage :MetapageDefinitionAbstract;
	var inputs :Map<MetaframeId, Map<MetaframePipeId, DataBlob>>;
	//Version counter for the metapage definition
	// @:optional var v :Int;
	//Version counter for the inputs
	@:optional var vi :Int;
}