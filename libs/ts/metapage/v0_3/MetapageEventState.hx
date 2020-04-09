package js.metapage.v0_3;

@:enum
abstract MetapageEventStateType(String) to String {
	var all   = "all";
	var delta = "delta";
}

typedef MetapageEventState = {
	var type :MetapageEventStateType;
	var state :MetapageInstanceInputs;
}
