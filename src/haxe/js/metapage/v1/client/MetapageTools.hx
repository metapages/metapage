package js.metapage.v1.client;

class MetapageTools
{
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

	/**
	 * Just strips the name
	 */
	public static function toDatablob(blob :PipeUpdateBlob) :DataBlob
	{
		var data :DataBlob = {
			value: blob.value
		};
		if (blob.type != null) {
			data.type = blob.type;
		}
		if (blob.source != null) {
			data.source = blob.source;
		}
		if (blob.encoding != null) {
			data.encoding = blob.encoding;
		}
		return data;
	}

	inline public static function log(o :Dynamic, ?color :String, ?backgroundColor :String, ?pos:haxe.PosInfos)
	{
		color = color != null ? color : "000";
		if (color != null && color.trim() == '') {
			color = null;
		}
		var s :String = switch(untyped __typeof__(o)) {
			case "string": cast o;
			case "number": o + "";
			default: Json.stringify(o);
		}
		var posString = pos == null ? '' : '${pos.fileName}:${pos.lineNumber} ';
		s = posString + s;

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