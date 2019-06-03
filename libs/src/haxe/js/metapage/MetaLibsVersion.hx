package js.metapage;

@:enum
abstract MetaLibsVersion(String) from String {
	var V0_0_1 = "0.0.1";
	var V0_1_0 = "0.1.0";
	var V0_2   = "0.2";
	var V0_3   = "0.3";
}

// class All
// {
// 	public static var all :MetaLibsVersion = js.metapage.AbstractEnumTools.getValues(js.metapage.MetaLibsVersion)[js.metapage.AbstractEnumTools.getValues(js.metapage.MetaLibsVersion).length - 1];
// }
