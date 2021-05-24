import { compare } from "compare-versions";
import { URL_PARAM_DEBUG } from "./Constants";
import { MetapageDefinition, MetaframeInputMap, MetaframeId, MetapageId, VersionsMetapage, MetapageVersionCurrent } from "./v0_4";
import { MetapageDefinition as V0_2MetapageDefinition } from "./v0_2/all";
import { MetapageDefinition as V0_3MetapageDefinition } from "./v0_3/all";

// metapages can convert any past version to the current version.
export const convertToCurrentDefinition = (def: any): MetapageDefinition => {
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
    case VersionsMetapage.V0_2:
      {
        updatedDefinition = convertToCurrentDefinition(definition_v0_2_to_v0_3(def as V0_2MetapageDefinition));
        break;
      }
    case VersionsMetapage.V0_3:
      {
        updatedDefinition = def as MetapageDefinition; // Latest
        break;
      }
    default:
      console.warn(`Metapage definition version=${def.version} but we only know up to version ${MetapageVersionCurrent}. Assuming the definition is compatible, but it's the future!`);
      updatedDefinition = def as MetapageDefinition; // Latest
      break;
  }
  return updatedDefinition;
};

const definition_v0_2_to_v0_3 = (old: V0_2MetapageDefinition): V0_3MetapageDefinition => {
  // Exactly the same except v0.3 has plugins
  old.version = VersionsMetapage.V0_3;
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
export const merge = (current: MetaframeInputMap, newInputs: MetaframeInputMap): boolean => {
  if (!newInputs) {
    return false;
  }
  let modified = false;
  Object.keys(newInputs).forEach((pipeId: string) => {
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

export const getMatchingVersion = (version: string): VersionsMetapage => {
  if (version == "latest") {
    return MetapageVersionCurrent;
  } else if (compare(version, "0.2", "<")) {
    throw `Unknown version: ${version}`;
  } else if (compare(version, "0.2", ">=") && compare(version, VersionsMetapage.V0_3, "<")) {
    return VersionsMetapage.V0_2;
  } else if (compare(version, "0.3", ">=")) {
    return VersionsMetapage.V0_3;
  } else {
    // Return something, assume latest
    console.log(`Could not match version=${version} to any known version, assuming ${MetapageVersionCurrent}`);
    return MetapageVersionCurrent;
  }
};

export const getUrlParam = (key: string): string | null => {
  if (!window.location.search) {
    return null;
  }
  return new URLSearchParams(window.location.search).get(key);
};

export const getUrlParamDEBUG = (): boolean => {
  return new URLSearchParams(window.location.search).has(URL_PARAM_DEBUG);
};

export const existsAnyUrlParam = (k: string[]): boolean => {
  const members = k.filter((param: string) => {
    return new URLSearchParams(window.location.search).has(param);
  });
  return members.length > 0;
};

export const generateMetaframeId = (length: number = 8): MetaframeId => {
  return generateId(length);
};

export const generateMetapageId = (length: number = 8): MetapageId => {
  return generateId(length);
};

export const generateNonce = (length: number = 8): string => {
  return generateId(length);
};

const LETTERS = "abcdefghijklmnopqrstuvwxyz0123456789";
export const generateId = (length: number = 8): string => {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = LETTERS.length;
  for (var i = 0; i < length; i++) {
    result += LETTERS.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

export const log = (o: any, color?: string, backgroundColor?: string) => {
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

export const stringToRgb = (str: string): string => {
  return intToRGB(hashCode(str));
};

export const hashCode = (str: string): number => {
  // java string#hashCode
  var hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
};

export const intToRGB = (i: number): string => {
  var c = (i & 0x00ffffff).toString(16).toUpperCase();
  return "00000".substring(0, 6 - c.length) + c;
};

/*
 * base64-arraybuffer
 * https://github.com/niklasvh/base64-arraybuffer
 *
 * Copyright (c) 2012 Niklas von Hertzen
 * Licensed under the MIT license.
 */

const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

// Use a lookup table to find the index.
const lookup = new Uint8Array(256);
for (var i = 0; i < chars.length; i++) {
  lookup[chars.charCodeAt(i)] = i;
}

export function base64encode(arraybuffer: ArrayBuffer): string {
  let bytes = new Uint8Array(arraybuffer);
  let i: number;
  let len = bytes.length;
  let base64 = "";

  for (i = 0; i < len; i += 3) {
    base64 += chars[bytes[i] >> 2];
    base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
    base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
    base64 += chars[bytes[i + 2] & 63];
  }

  if (len % 3 === 2) {
    base64 = base64.substring(0, base64.length - 1) + "=";
  } else if (len % 3 === 1) {
    base64 = base64.substring(0, base64.length - 2) + "==";
  }

  return base64;
}

export function base64decode(base64: string): ArrayBuffer {
  if (!base64) {
    throw new Error("base64decode string argument given");
  }
  let bufferLength = base64.length * 0.75,
    len = base64.length,
    i: number,
    p = 0,
    encoded1: number,
    encoded2: number,
    encoded3: number,
    encoded4: number;

  if (base64[base64.length - 1] === "=") {
    bufferLength--;
    if (base64[base64.length - 2] === "=") {
      bufferLength--;
    }
  }

  var arraybuffer = new ArrayBuffer(bufferLength),
    bytes = new Uint8Array(arraybuffer);

  for (i = 0; i < len; i += 4) {
    encoded1 = lookup[base64.charCodeAt(i)];
    encoded2 = lookup[base64.charCodeAt(i + 1)];
    encoded3 = lookup[base64.charCodeAt(i + 2)];
    encoded4 = lookup[base64.charCodeAt(i + 3)];

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
  }

  return arraybuffer;
}


export const isPageLoaded = (): boolean => {
  return document.readyState == "complete" || document.readyState == "interactive";
  // https://stackoverflow.com/questions/13364613/how-to-know-if-window-load-event-was-fired-already/28093606
  // // TODO ugh casting here but I can't seem to get the right type with the loadEventEnd
  // return window.performance.getEntriesByType("navigation").every((e) => { return (e as PerformanceNavigationTiming).loadEventEnd > 0 });
};

export const pageLoaded = async (): Promise<void> => {
  if (isPageLoaded()) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    let loaded = false;
    window.addEventListener('load', () => {
      if (loaded) {
        return;
      }
      loaded = true;
      resolve();
    });
    // tiny chance of missing the document.readyState === "loaded"
    const timer = setTimeout(() => {
      if (!loaded && isPageLoaded()) {
        loaded = true;
        resolve();
      }
    }, 200);
  })
};
