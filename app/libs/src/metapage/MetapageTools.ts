import stringify from "fast-json-stable-stringify";
import { create } from "mutative";
import { MetapageHashParams } from "./Shared.js";
import { MetaframeId, MetapageId } from "./core.js";
import { MetaframeInputMap } from "./v0_4/index.js";
import { MetapageDefinitionV2 } from "./v2/metapage.js";
/**
 * Merges new values into the a new object.
 * Does NOT check if there are actually new keys.
 * Does NOT check values against each other. This means you
 * can keep sending the same value, and the message will
 * be passed in.
 * Returns the original map if nothing modified.
 */
export const merge = (
  current: MetaframeInputMap,
  newInputs: MetaframeInputMap
): MetaframeInputMap => {
  if (!newInputs) {
    return current;
  }
  return create<MetaframeInputMap>(current, (draft: MetaframeInputMap) => {
    Object.keys(newInputs).forEach((pipeId: string) => {
      // undefined means remove the key
      // null means keep the key, but set to null
      if (newInputs[pipeId] === undefined) {
        delete draft[pipeId];
      } else {
        draft[pipeId] = newInputs[pipeId];
      }
    });
  });
};

export const getUrlParam = (key: MetapageHashParams): string | null => {
  if (!globalThis?.location.search) {
    return null;
  }
  return new URLSearchParams(globalThis.location.search).get(key);
};

export const getUrlParamDebug = (): boolean => {
  return new URLSearchParams(globalThis.location.search).has(
    MetapageHashParams.mp_debug
  );
};

export const isDebugFromUrlsParams = (): boolean => {
  const param = new URLSearchParams(globalThis?.location?.search).get(
    MetapageHashParams.mp_debug
  );
  return param === "true" || param === "1";
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
  var charactersLength = LETTERS.length;
  for (var i = 0; i < length; i++) {
    result += LETTERS.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

export const log = (o: any, color?: string, backgroundColor?: string) => {
  color = color ? color : "000";
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
    globalThis.console.log(s, cssstring);
  } else {
    globalThis.console.log(s);
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

export const isPageLoaded = (): boolean => {
  return (
    globalThis?.document?.readyState == "complete" || globalThis?.document?.readyState == "interactive"
  );
  // https://stackoverflow.com/questions/13364613/how-to-know-if-window-load-event-was-fired-already/28093606
  // // TODO ugh casting here but I can't seem to get the right type with the loadEventEnd
  // return globalThis.performance.getEntriesByType("navigation").every((e) => { return (e as PerformanceNavigationTiming).loadEventEnd > 0 });
};

export const pageLoaded = async (): Promise<void> => {
  if (isPageLoaded()) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    if (isPageLoaded()) {
      resolve();
      return;
    }
    let loaded = false;
    globalThis?.addEventListener("load", () => {
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
  });
};

export const metapageAllSha256Hash = async (metapage: MetapageDefinitionV2) => {
  const metapageStr = stringify(metapage);
  return await sha256ToBase64(metapageStr);
};

export const metapageOnlyEssentailSha256Hash = async (
  metapage: Pick<MetapageDefinitionV2, "metaframes" | "version">
) => {
  const metapageStr = stringify({
    version: metapage.version,
    metaframes: metapage.metaframes,
  });
  return await sha256ToBase64(metapageStr);
};

async function sha256ToBase64(str: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}
