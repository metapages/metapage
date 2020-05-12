import {compare} from "compare-versions";
import {URL_PARAM_DEBUG} from "./Constants";
import {Versions, AllVersions, CurrentVersion} from "./MetaLibsVersion";
import {MetaframeInputMap, MetaframeId, MetapageId, MetapageDefinition} from "./v0_3/all";

import {MetapageDefinition as V0_2MetapageDefinition} from "./v0_2/all";
import {MetapageDefinition as V0_3MetapageDefinition} from "./v0_3/all";

// metapages can convert any past version to the current version.
export const convertToCurrentDefinition = (def : any): MetapageDefinition => {
  if (def === null) {
    throw "Metapage definition cannot be null";
  }
  if (typeof def === "string") {
    try {
      def = JSON.parse(def);
    } catch (err) {
      throw `Cannot parse into JSON:\n${def}`;
    }
  }

  // Recursively convert up the version
  let updatedDefinition: MetapageDefinition;
  switch (getMatchingVersion(def.version)) {
    case Versions.V0_2:
      {
        updatedDefinition = convertToCurrentDefinition(definition_v0_2_to_v0_3(def as V0_2MetapageDefinition));
        break;
      }
    case Versions.V0_3:
      {
        updatedDefinition = def as MetapageDefinition; // Latest
        break;
      }
    default:
      {
        throw `Unknown metapage version: ${
        def.version}. Supported versions: [${AllVersions.join(", ")}]`;
      }
  }
  return updatedDefinition;
};

const definition_v0_2_to_v0_3 = (old : V0_2MetapageDefinition): V0_3MetapageDefinition => {
  // Exactly the same except v0.3 has plugins
  old.version = Versions.V0_3;
  return old;
};

/**
 * Merges new values into the current object.
 * Does NOT check if there are actually new keys.
 * Does NOT check values against each other. This means you
 * can keep sending the same value, and the message will
 * be passed in.
 * Returns true if the original map was modified.
 */
export const merge = (current : MetaframeInputMap, newInputs : MetaframeInputMap): boolean => {
  if (!newInputs) {
    return false;
  }
  let modified = false;
  Object.keys(newInputs).forEach((pipeId : string) => {
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
};

export const getMatchingVersion = (version : string): Versions => {
  if (version == "latest") {
    return CurrentVersion;
  } else if (compare(version, "0.0.x", "<")) {
    return Versions.V0_0_1;
  } else if (compare(version, "0.1.36", ">=") && compare(version, Versions.V0_2, "<")) {
    return Versions.V0_1_0;
  } else if (compare(version, "0.2", ">=") && compare(version, Versions.V0_3, "<")) {
    return Versions.V0_2;
  } else if (compare(version, "0.3", ">=")) {
    return Versions.V0_3;
  } else {
    // Return something, assume latest
    console.log(`Could not match version=${version} to any known version, assuming ${CurrentVersion}`);
    return CurrentVersion;
  }
};

export const getUrlParam = (key : string): string | null => {
  if (!window.location.search) {
    return null;
  }
  return new URLSearchParams(window.location.search).get(key);
};

export const getUrlParamDEBUG = (): boolean => {
  return new URLSearchParams(window.location.search).has(URL_PARAM_DEBUG);
};

export const existsAnyUrlParam = (k : string[]): boolean => {
  const members = k.filter((param : string) => {
    return new URLSearchParams(window.location.search).has(param);
  });
  return members.length > 0;
};

export const generateMetaframeId = (length : number = 8): MetaframeId => {
  return generateId(length);
};

export const generateMetapageId = (length : number = 8): MetapageId => {
  return generateId(length);
};

export const generateNonce = (length : number = 8): string => {
  return generateId(length);
};

const LETTERS = "abcdefghijklmnopqrstuvwxyz0123456789";
export const generateId = (length : number = 8): string => {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = LETTERS.length;
  for (var i = 0; i < length; i++) {
    result += LETTERS.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

export const log = (o : any, color? : string, backgroundColor? : string) => {
  color = color
    ? color
    : "000";
  if (color && color.trim() == "") {
    color = undefined;
  }
  let s: string;
  if (typeof o === "string") {
    s = o as string;
  } else if (typeof o === "number") {
    s = o + "";
  } else {
    s = JSON.stringify(o, null, "  ");
  }

  if (color && color.trim() != "") {
    var cssstring = `color: #${color}`;
    if (backgroundColor) {
      cssstring = `${cssstring}; background: #${backgroundColor}`;
    }
    s = `%c${s}`;
    window.console.log(s, cssstring);
  } else {
    window.console.log(s);
  }
};

export const stringToRgb = (str : string): string => {
  return intToRGB(hashCode(str));
};

export const hashCode = (str : string): number => {
  // java string#hashCode
  var hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
};

export const intToRGB = (i : number): string => {
  var c = (i & 0x00ffffff).toString(16).toUpperCase();
  return "00000".substring(0, 6 - c.length) + c;
};
