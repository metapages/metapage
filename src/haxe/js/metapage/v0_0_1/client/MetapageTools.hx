package js.metapage.v0_0_1.client;

class MetapageTools
{
	/**
	 * currentInputs, maybeNewInputs, updated
	 * @param  url :String       [description]
	 * @return     [description]
	 */
	public static function mergeNewImportsIntoCurrentReturnUpdated(maybeNew :MetaframeInputMap, current :MetaframeInputMap) :MetaframeInputMap
	{
		if (maybeNew == current) {
			//Equality means no updates
			return null;
		}

		var actuallyNewInputs :MetaframeInputMap = null;
		for (pipeId in maybeNew.keys()) {
			var blob :DataBlob = maybeNew[pipeId];
			if (!current.exists(pipeId) || !equals(current[pipeId], blob)) {
				actuallyNewInputs = actuallyNewInputs == null ? {} : actuallyNewInputs;
				var version = current.exists(pipeId) && current[pipeId].v != null ? current[pipeId].v : 0;
				version++;
				blob.v = version;
				actuallyNewInputs[pipeId] = blob;
				current[pipeId] = blob;
			}
		}
		return actuallyNewInputs;
	}

	public static function getOnlyNewUpdates(current :MetapageInstanceInputs, maybeNew :MetapageInstanceInputs) :MetapageInstanceInputs
	{
		if (maybeNew == null) {
			return null;
		}
		var actualNew :MetapageInstanceInputs = null;
		for (metaframeId in maybeNew.keys()) {
			if (!current.exists(metaframeId)) {
				actualNew = actualNew == null ? {} : actualNew;
				actualNew[metaframeId] = maybeNew[metaframeId];
			} else {
				for (pipeId in maybeNew[metaframeId].keys()) {
					var currentBlob = current[metaframeId][pipeId];
					if (currentBlob == null || (currentBlob.v != null && currentBlob.v < maybeNew[metaframeId][pipeId].v)) {
						actualNew = actualNew == null ? {} : actualNew;
						if (actualNew[metaframeId] == null) {
							actualNew[metaframeId] = {};
						}
						actualNew[metaframeId][pipeId] = maybeNew[metaframeId][pipeId];
					}
				}
			}
		}

		return actualNew;
	}

	//Does no version checking, it is assumed that the updated are already version checked
	public static function merge(current :MetapageInstanceInputs, updated :MetapageInstanceInputs) :MetapageInstanceInputs
	{
		if (updated == null) {
			return current;
		}

		var result :MetapageInstanceInputs = Reflect.copy(current);
		for (metaframeId in updated.keys()) {
			if (!current.exists(metaframeId)) {
				result[metaframeId] = updated[metaframeId];
			} else {
				for (pipeId in updated[metaframeId].keys()) {
					result[metaframeId][pipeId] = updated[metaframeId][pipeId];
				}
			}
		}

		return result;
	}

	/**
	 * Only returns updated object if origin modified
	 */
	public static function filterOutNullsMetapage(values :MetapageInstanceInputs) :MetapageInstanceInputs
	{
		if (values == null) {
			return null;
		}
		var result :MetapageInstanceInputs = values;

		for (metaframeId in values.keys()) {
			var metaFrameValues = values.get(metaframeId);
			metaFrameValues = filterOutNullsMetaframe(metaFrameValues);
			if (values.get(metaframeId) != metaFrameValues) {
				if (result == values) {
					result = Reflect.copy(values);
				}
				result.set(metaframeId, metaFrameValues);
			}
		}
		return result;
	}

	/**
	 * Only returns updated object if origin modified
	 */
	public static function filterOutNullsMetaframe(values :MetaframeInputMap) :MetaframeInputMap
	{
		if (values == null) {
			return null;
		}
		var result :MetaframeInputMap = values;
		for (pipeId in values.keys()) {
			if (values.get(pipeId).value == null) {
				result = result == values ? Reflect.copy(values) : result;
				Reflect.deleteField(result, pipeId);
			}
		}
		return result;
	}

	public static function equals(blob :DataBlob, other :DataBlob) :Bool
	{
		assert(blob != null);
		assert(other != null);
		return
				(blob.v != null && blob.v == other.v)
				||
				(blob.value == other.value &&
				blob.source == other.source &&
				blob.encoding == other.encoding);
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