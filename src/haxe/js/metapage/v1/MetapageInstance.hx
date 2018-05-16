package js.metapage.v1;

import metapage.*;

typedef MetapageInstance = {//>MetapageInstanceDefinition, >MetapageInstanceInputs,
	var id :MetapageId;
	var metapage :MetapageDefinitionAbstract;
	var state :MetapageInstanceInputs;
	// var id :MetapageId;
	// var metapage :MetapageDefinitionAbstract;
	// var inputs :Map<MetaframeId, Map<MetaframePipeId, DataBlob>>;
	// //Version counter for the metapage definition
	// @:optional var v :Int;
	// //Version counter for the inputs
	// @:optional var vi :Int;
	// @:optional

	//Version counter for the metapage definition
	// var vm :Int;
	//Version counter for the inputs
	// var vi :Int;
}

//Sub-types, for the server, not sure if strictly needed.
//Meant for fast updating only parts
// typedef MetapageInstanceDefinition = {
// 	var id :MetapageId;
// 	var metapage :MetapageDefinitionAbstract;
// 	// var inputs :Map<MetaframeId, Map<MetaframePipeId, DataBlob>>;

// 	//Version counter for the inputs
// 	// @:optional var vi :Int;
// }

// typedef MetapageInstanceInputs = {
// 	// var id :MetapageId;
// 	// var metapage :MetapageDefinitionAbstract;
// 	var inputs :Map<MetaframeId, Map<MetaframePipeId, DataBlob>>;
// 	//Version counter for the metapage definition
// 	// @:optional var v :Int;
// 	//Version counter for the inputs
// 	// @:optional
// 	// var vi :Int;
// }