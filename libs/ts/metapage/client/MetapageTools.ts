package js.metapage.client;

import js.npm.compareversions.CompareVersions.compareVersions;

class MetapageTools
{
	static var minimatch :String->String->Bool = js.Lib.require('minimatch');

	public static function convertToCurrentDefinition(def :Dynamic) :MetapageDefinition
	{
		if (def == null) {
			throw 'Metapage definition cannot be null';
		}
		if (js.Syntax.typeof(def) == 'string') {
			try {
				def = Json.parse(def);
			} catch(err :Dynamic) {
				throw 'Cannot parse into JSON:\n${def}';
			}
		}

		// Recursively convert up the version
		return switch(getMatchingVersion(def.version)) {
			case V0_0_1: convertToCurrentDefinition(definition_v0_0_1_to_v0_1_0(def));
			case V0_1_0: convertToCurrentDefinition(definition_v0_1_0_to_v0_2(def));
			case V0_2:   convertToCurrentDefinition(definition_v0_2_to_v0_3(def));
			case V0_3:   cast def; // Latest
			default: throw 'Unknown metapage version: ${def.version}. Supported versions: [${macros.AbstractEnumTools.getValues(js.metapage.MetaLibsVersion).join(", ")}]';
		}
	}

	static function definition_v0_0_1_to_v0_1_0(old :js.metapage.v0_0_1.MetapageDefinition) :js.metapage.v0_1_0.MetapageDefinition
	{
		var def :js.metapage.v0_1_0.MetapageDefinition = {
			version: MetaLibsVersion.V0_1_0,
			id     : old.id, // != null ? old.id: MetapageTools.generateMetapageId(),
			iframes: {},                                                           // update below
			meta   : cast old.meta,                                                     // not great upgrade support here
			options: old.options,                                                  // TODO possibly deprecated
			v      : old.v
		};
		for (metaframeId in old.iframes.keys()) {
			var oldMetaframeDef :js.metapage.v0_0_1.MetaframeInstance = old.iframes[metaframeId];
			var newMetaframeDef :js.metapage.v0_1_0.MetaframeInstance = {
				id       : metaframeId,
				inputs   : [],   // Updated below
				metaframe: null, // deprecated but compiler expects
				url      : oldMetaframeDef.url,
				// state: deprecated, ignored from now on
				// outputs: deprecated, ignored from now on
			};
			def.iframes.set(metaframeId, newMetaframeDef);
		}

		if (old.pipes != null) {
			for (pipeDef in old.pipes) {
				// typedef Pipe = {
				// 	var source :{id, name};
				// 	var target :{id, name};
				// }
				var pipeInput :js.metapage.v0_1_0.PipeInput = {
					metaframe: pipeDef.source.id,
					source: pipeDef.source.name,
					target: pipeDef.target.name,
				};
				def.iframes[pipeDef.target.id].inputs.push(pipeInput);
			}
		}

		return def;
	}

	static function definition_v0_1_0_to_v0_2(old :js.metapage.v0_1_0.MetapageDefinition) :js.metapage.v0_2.MetapageDefinition
	{
		var def :js.metapage.v0_2.MetapageDefinition = {
			version   : MetaLibsVersion.V0_2,
			id        : old.id, // != null ? old.id: MetapageTools.generateMetapageId(),
			metaframes: old.iframes,                                                  // update below
			meta      : cast old.meta,                                                     // not great upgrade support here
			options   : old.options,                                                  // TODO possibly deprecated
		};
		return def;
	}

	static function definition_v0_2_to_v0_3(old :js.metapage.v0_2.MetapageDefinition) :js.metapage.v0_3.MetapageDefinition
	{
		// Exactly the same except v0.3 has plugins
		old.version = MetaLibsVersion.V0_3;
		return cast old;
	}
	
	/**
	 * Merges new values into the current object.
	 * Does NOT check if there are actually new keys.
	 * Does NOT check values against each other. This means you
	 * can keep sending the same value, and the message will
	 * be passed in.
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
			// undefined means remove the key
			// null means keep the key, but set to null
			if (js.Syntax.strictEq(newInputs[pipeId], js.Lib.undefined)) {
				current.remove(pipeId);
			} else {
				current[pipeId] = newInputs[pipeId];
			}
		}
		return modified;
	}

	public static function getMatchingVersion(version :String) :MetaLibsVersion
	{
		return if (version == 'latest') {
			return Metapage.version;
		} else if (compareVersions(version, '0.0.x') <= 0) {
			MetaLibsVersion.V0_0_1;
		} else if (compareVersions(version, '0.1.36') >= 0 && compareVersions(version, '${MetaLibsVersion.V0_2}') < 0) {
			MetaLibsVersion.V0_1_0;
		} else if (compareVersions(version, '0.2') >= 0 && compareVersions(version, '${MetaLibsVersion.V0_3}') < 0) {
			MetaLibsVersion.V0_2;
		} else if (compareVersions(version, '0.3') >= 0) {
			MetaLibsVersion.V0_3;
		} else {
			// Return something, assume latest
			js.Browser.window.console.log('Could not match version=${version} to any known version, assuming ${Metapage.version}');
			Metapage.version;
		}
	}

	public static function getUrlParam(key :String) :Null<String>
	{
		return new js.html.URLSearchParams(js.Browser.window.location.search).get(key);
	}

	public static function getUrlParamDEBUG() :Bool
	{
		return new js.html.URLSearchParams(js.Browser.window.location.search).has(URL_PARAM_DEBUG);
	}

	public static function existsAnyUrlParam(k :Array<String>) :Bool
	{
		return k.exists(function(param :String) {
			return new js.html.URLSearchParams(js.Browser.window.location.search).has(param);
		});
	}

	public static function generateMetaframeId(?length :Int = 8) :MetaframeId
	{
		return new MetaframeId(generateId(length));
	}

	public static function generateMetapageId(?length :Int = 8) :MetapageId
	{
		return new MetapageId(generateId(length));
	}

	public static function generateNonce(?length :Int = 8) :String
	{
		return generateId(length);
	}

	static var LETTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';
	public static function generateId(?length :Int = 8) :String
	{
		var s = new StringBuf();
		while (length > 0) {
			s.add(LETTERS.charAt(Std.int(Math.max(0, Math.random()*LETTERS.length - 1))));
			length--;
		}
		return s.toString();
	}

	inline public static function log(o :Dynamic, ?color :String, ?backgroundColor :String, pos:haxe.PosInfos)
	{
		color = color != null ? color : "000";
		if (color != null && color.trim() == '') {
			color = null;
		}
		var s :String = switch(js.Syntax.typeof(o)) {
			case "string": cast o;
			case "number": o + "";
			default: Json.stringify(o, null, "  ");
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
