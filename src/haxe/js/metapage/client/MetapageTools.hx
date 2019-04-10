package js.metapage.client;

class MetapageTools
{
	public static var URL_PARAM_DEBUG = 'MP_DEBUG';
	public static var URL_PARAM_METAFRAME_ID = 'MF_ID';
	/**
	 * Merges new values into the current object.
	 * Does NOT check if there are actually new keys.
	 * Returns true if the original map was modified.
	 * Use this function via Static Extensions
	 */
	public static function merge(current :MetaframeInputMap, newInputs :MetaframeInputMap) :Bool
	{
		if (newInputs == null) {
			return false;
		}
		var modified = false;
		for (pipeId in newInputs.keys()) {
			modified = true;
			// Undefined means remove the key
			if (js.Syntax.strictEq(newInputs[pipeId], js.Lib.undefined)) {
				current.remove(pipeId);
			} else {
				current[pipeId] = newInputs[pipeId];
			}
		}
		return modified;
	}

	public static function getUrlParam(key :String) :Null<String>
	{
		return new js.html.URLSearchParams(js.Browser.window.location.search).get(key);
	}

	public static function getUrlParamDEBUG() :Bool
	{
		return new js.html.URLSearchParams(js.Browser.window.location.search).has(URL_PARAM_DEBUG);
	}

	public static function getUrlParamMF_ID() :String
	{
		return new js.html.URLSearchParams(js.Browser.window.location.search).get(URL_PARAM_METAFRAME_ID);
	}

	public static function generateMetaframeId(?length :Int = 8) :MetaframeId
	{
		return new MetaframeId(generateId(8));
	}

	public static function generateMetapageId(?length :Int = 8) :MetapageId
	{
		return new MetapageId(generateId(8));
	}

	static var LETTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';
	static function generateId(?length :Int = 8) :String
	{
		var s = new StringBuf();
		while (length > 0) {
			s.add(LETTERS.charAt(Std.int(Math.max(0, Math.random()*LETTERS.length - 1))));
			length--;
		}
		return s.toString();
	}

	// inline public static function log(o :Dynamic, ?color :String, ?backgroundColor :String, ?pos:haxe.PosInfos)
	inline public static function log(o :Dynamic, ?color :String, ?backgroundColor :String)
	{
		color = color != null ? color : "000";
		if (color != null && color.trim() == '') {
			color = null;
		}
		var s :String = switch(js.Syntax.typeof(o)) {
			case "string": cast o;
			case "number": o + "";
			default: Json.stringify(o);
		}
		// var posString = pos == null ? '' : '${pos.fileName}:${pos.lineNumber} ';
		// s = posString + s;

		if (color != null && color.trim() != '') {
			var cssString = 'color: #$color';
			if (backgroundColor != null) {
				cssString = '$cssString; background: #$backgroundColor';
			}
			s = '%c$s';
			js.Browser.window.console.log(s, cssString);
		} else {
			js.Browser.window.console.log(s);
		}
	}

	inline public static function stringToRgb(str :String) :String
	{
		return intToRGB(hashCode(str));
	}

	inline public static function hashCode(str :String) :Int// java String#hashCode
	{
		var hash = 0;
		for (i in 0...str.length) {
			hash = str.charCodeAt(i) + ((hash << 5) - hash);
		}
		return hash;
	}

	inline public static function intToRGB(i :Int) :String
	{
		var c = untyped (i & 0x00FFFFFF)
			.toString(16)
			.toUpperCase();
		return "00000".substring(0, 6 - c.length) + c;
	}
}
