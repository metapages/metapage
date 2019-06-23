package js.metapage;

class Constants
{
	inline public static var METAFRAME_JSON_FILE     = 'metaframe.json';
	inline public static var METAPAGE_KEY_DEFINITION = 'metapage/definition';
	inline public static var METAPAGE_KEY_STATE      = 'metapage/state';
	inline public static var URL_PARAM_DEBUG         = 'MP_DEBUG';

	public static var VERSIONS_ALL :Array<MetaLibsVersion> = macros.AbstractEnumTools.getValues(js.metapage.MetaLibsVersion);
	public static var VERSION :MetaLibsVersion = VERSIONS_ALL[VERSIONS_ALL.length - 1];
}
