import compareVersions from 'compare-versions';
import {URL_PARAM_DEBUG } from '../Constants';
import {Versions, CurrentVersion} from '../MetaLibsVersion';
// import * as minimatch from "minimatch";
import { MetaframeInputMap, MetaframeId, MetapageId} from '@definitions/all';

// import { MetapageDefinition as v0_0_1MetapageDefinition } from 'v0_0_1/all';

	// export const convertToCurrentDefinition :(def :any) :MetapageDefinition = (def) =>
	// {
	// 	if (def === null) {
	// 		throw 'Metapage definition cannot be null';
	// 	}
	// 	if (typeof(def) === 'string') {
	// 		try {
	// 			def = JSON.parse(def);
	// 		} catch(err) {
	// 			throw 'Cannot parse into JSON:\n${def}';
	// 		}
	// 	}

	// 	// Recursively convert up the version
	// 	switch(getMatchingVersion(def.version)) {
	// 		case Versions.V0_0_1: {
	// 			def = convertToCurrentDefinition(definition_v0_0_1_to_v0_1_0(def));
	// 			break;
	// 		}
	// 		case Versions.V0_1_0: {
	// 			 def = convertToCurrentDefinition(definition_v0_1_0_to_v0_2(def));
	// 			 break;
	// 		}
	// 		case Versions.V0_2: {
	// 			def = convertToCurrentDefinition(definition_v0_2_to_v0_3(def));
	// 			break;
	// 		}
	// 		case Versions.V0_3: {
	// 			def = def as MetapageDefinition; // Latest
	// 			break;
	// 		}
	// 		default: {
	// 			throw 'Unknown metapage version: ${def.version}. Supported versions: [${macros.AbstractEnumTools.getValues(js.metapage.MetaLibsVersion).join(", ")}]';
	// 		}
	// 	}
	// }

	// export const definition_v0_0_1_to_v0_1_0 (old :v0_0_1MetapageDefinition) => js.metapage.v0_1_0.MetapageDefinition = (old) => 
	// {
	// 	var def :js.metapage.v0_1_0.MetapageDefinition = {
	// 		version: MetaLibsVersion.V0_1_0,
	// 		id     : old.id, // != null ? old.id: MetapageTools.generateMetapageId(),
	// 		iframes: {},                                                           // update below
	// 		meta   : cast old.meta,                                                     // not great upgrade support here
	// 		options: old.options,                                                  // TODO possibly deprecated
	// 		v      : old.v
	// 	};
	// 	for (metaframeId in old.iframes.keys()) {
	// 		var oldMetaframeDef :js.metapage.v0_0_1.MetaframeInstance = old.iframes[metaframeId];
	// 		var newMetaframeDef :js.metapage.v0_1_0.MetaframeInstance = {
	// 			id       : metaframeId,
	// 			inputs   : [],   // Updated below
	// 			metaframe: null, // deprecated but compiler expects
	// 			url      : oldMetaframeDef.url,
	// 			// state: deprecated, ignored from now on
	// 			// outputs: deprecated, ignored from now on
	// 		};
	// 		def.iframes.set(metaframeId, newMetaframeDef);
	// 	}

	// 	if (old.pipes != null) {
	// 		for (pipeDef in old.pipes) {
	// 			// typedef Pipe = {
	// 			// 	var source :{id, name};
	// 			// 	var target :{id, name};
	// 			// }
	// 			var pipeInput :js.metapage.v0_1_0.PipeInput = {
	// 				metaframe: pipeDef.source.id,
	// 				source: pipeDef.source.name,
	// 				target: pipeDef.target.name,
	// 			};
	// 			def.iframes[pipeDef.target.id].inputs.push(pipeInput);
	// 		}
	// 	}

	// 	return def;
	// }

	// static function definition_v0_1_0_to_v0_2(old :js.metapage.v0_1_0.MetapageDefinition) :js.metapage.v0_2.MetapageDefinition
	// {
	// 	var def :js.metapage.v0_2.MetapageDefinition = {
	// 		version   : MetaLibsVersion.V0_2,
	// 		id        : old.id, // != null ? old.id: MetapageTools.generateMetapageId(),
	// 		metaframes: old.iframes,                                                  // update below
	// 		meta      : cast old.meta,                                                     // not great upgrade support here
	// 		options   : old.options,                                                  // TODO possibly deprecated
	// 	};
	// 	return def;
	// }

	// static function definition_v0_2_to_v0_3(old :js.metapage.v0_2.MetapageDefinition) :js.metapage.v0_3.MetapageDefinition
	// {
	// 	// Exactly the same except v0.3 has plugins
	// 	old.version = MetaLibsVersion.V0_3;
	// 	return cast old;
	// }
	
	/**
	 * Merges new values into the current object.
	 * Does NOT check if there are actually new keys.
	 * Does NOT check values against each other. This means you
	 * can keep sending the same value, and the message will
	 * be passed in.
	 * Returns true if the original map was modified.
	 */
	export const merge = (current :MetaframeInputMap, newInputs :MetaframeInputMap) :boolean =>
	{
		if (!newInputs) {
			return false;
		}
		let modified = false;
		Object.keys(newInputs).forEach((pipeId :string) => {
			modified = true;
			// undefined means remove the key
			// null means keep the key, but set to null
			if (newInputs[pipeId] === undefined) {
				delete current[pipeId];
			} else {
				current[pipeId] = newInputs[pipeId];
			}
		});
		return modified;
	}

	export const getMatchingVersion = (version :string) :Versions =>
	{
		if (version == 'latest') {
			return CurrentVersion;
		} else if (compareVersions(version, '0.0.x') <= 0) {
			return Versions.V0_0_1;
		} else if (compareVersions(version, '0.1.36') >= 0 && compareVersions(version, Versions.V0_2) < 0) {
			return Versions.V0_1_0;
		} else if (compareVersions(version, '0.2') >= 0 && compareVersions(version, Versions.V0_3) < 0) {
			return Versions.V0_2;
		} else if (compareVersions(version, '0.3') >= 0) {
			return Versions.V0_3;
		} else {
			// Return something, assume latest
			console.log('Could not match version=${version} to any known version, assuming ${Metapage.version}');
			return CurrentVersion;
		}
	}

	export const getUrlParam = (key :string) :string | undefined =>
	{
		return new URLSearchParams(window.location.search).get(key);
	}

	export const getUrlParamDEBUG = () :boolean =>
	{
		return new URLSearchParams(window.location.search).has(URL_PARAM_DEBUG);
	}

	export const existsAnyUrlParam = (k :string[]) :boolean =>
	{
		const members = k.filter((param :string) => {
			return new URLSearchParams(window.location.search).has(param);
		});
		return members.length > 0;
	}

	export const generateMetaframeId = (length :number = 8) :MetaframeId =>
	{
		return generateId(length);
	}

	export const generateMetapageId = (length :number = 8) :MetapageId =>
	{
		return generateId(length);
	}

	export const  generateNonce = (length :number = 8) :string =>
	{
		return generateId(length);
	}

	const LETTERS = 'abcdefghijklmnopqrstuvwxyz0123456789';
	export const generateId = (length :number = 8) :string => 
	{
		var result           = '';
		var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		var charactersLength = LETTERS.length;
		for ( var i = 0; i < length; i++ ) {
			result += LETTERS.charAt(Math.floor(Math.random() * charactersLength));
		}
		return result;
	}

	// export const  log = (o :any, color ?:string, backgroundColor ?:string) =>
	// {
	// 	color = color != null ? color : "000";
	// 	if (color != null && color.trim() == '') {
	// 		color = null;
	// 	}
	// 	let s :string;
	// 	if ()
	// 	var s :string = switch(js.Syntax.typeof(o)) {
	// 		case "string": cast o;
	// 		case "number": o + "";
	// 		default: Json.stringify(o, null, "  ");
	// 	}
	// 	var posstring = pos == null ? '' : '${pos.fileName}:${pos.lineNumber} ';
	// 	s = posstring + s;

	// 	if (color != null && color.trim() != '') {
	// 		var cssstring = 'color: #$color';
	// 		if (backgroundColor != null) {
	// 			cssstring = '$cssstring; background: #$backgroundColor';
	// 		}
	// 		s = '%c$s';
	// 		js.Browser.window.console.log(s, cssstring);
	// 	} else {
	// 		js.Browser.window.console.log(s);
	// 	}
	// }

	export const stringToRgb = (str :string) :string =>
	{
		return intToRGB(hashCode(str));
	}

	export const hashCode = (str :string) :number=> // java string#hashCode
	{
		var hash = 0;
		for (let i = 0;i < str.length; i++) {
			hash = str.charCodeAt(i) + ((hash << 5) - hash);
		}
		return hash;
	}

	export const intToRGB = (i :number) :string =>
	{
		var c = (i & 0x00FFFFFF)
			.toString(16)
			.toUpperCase();
		return "00000".substring(0, 6 - c.length) + c;
	}
