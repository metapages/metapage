import { compare } from "compare-versions";
import { MetapageHashParams } from "./Shared";
import {
  MetapageDefinition,
  MetaframeInputMap,
  MetaframeId,
  MetapageId,
  VersionsMetapage,
  MetapageVersionCurrent,
  MetaframeDefinitionV5,
  VersionsMetaframe,
  MetaframeDefinitionV4,
} from "./v0_4";
import { MetapageDefinition as V0_2MetapageDefinition } from "./v0_2/all";
import { MetapageDefinition as V0_3MetapageDefinition } from "./v0_3/all";

export const convertMetaframeJsonToCurrentVersion = (
  m: MetaframeDefinitionV5 | MetaframeDefinitionV4
): MetaframeDefinitionV5 => {
  switch (m.version) {
    case VersionsMetaframe.V0_3:
    case VersionsMetaframe.V0_4:
      const source: MetaframeDefinitionV4 = m as MetaframeDefinitionV4;
      const metaframeDefV5: MetaframeDefinitionV5 = {
        version: VersionsMetaframe.V0_5,
        inputs: source.inputs,
        outputs: source.outputs,
        allow: source.allow,
        metadata: source.metadata
          ? {
              name: source.metadata.title,
              author: source.metadata.author,
              image: source.metadata.image,
              description: source.metadata.descriptionUrl,
              tags: source.metadata.keywords,
            }
          : undefined,
      };
    case VersionsMetaframe.V0_5:
      return m as MetaframeDefinitionV5;
    default:
      throw `Unsupported metaframe version: ${m.version}. Please upgrade to a new version: npm i @metapages/metapage@latest`;
  }
};

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

  if (!def.version) {
    throw 'Missing "version" key in metapage definition';
  }

  // Recursively convert up the version
  let updatedDefinition: MetapageDefinition;

  switch (getMatchingVersion(def.version)) {
    case VersionsMetapage.V0_2: {
      updatedDefinition = convertToCurrentDefinition(
        definition_v0_2_to_v0_3(def as V0_2MetapageDefinition)
      );
      break;
    }
    case VersionsMetapage.V0_3: {
      updatedDefinition = def as MetapageDefinition; // Latest
      break;
    }
    default: // Latest
      console.warn(
        `Metapage definition version=${def.version} but we only know up to version ${MetapageVersionCurrent}. Assuming the definition is compatible, but it's the future!`
      );
      updatedDefinition = def as MetapageDefinition;
      break;
  }
  return updatedDefinition;
};

const definition_v0_2_to_v0_3 = (
  old: V0_2MetapageDefinition
): V0_3MetapageDefinition => {
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
export const merge = (
  current: MetaframeInputMap,
  newInputs: MetaframeInputMap
): boolean => {
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
  if (version === "latest") {
    return MetapageVersionCurrent;
  } else if (compare(version, "0.2", "<")) {
    throw `Unknown version: ${version}`;
  } else if (
    compare(version, "0.2", ">=") &&
    compare(version, VersionsMetapage.V0_3, "<")
  ) {
    return VersionsMetapage.V0_2;
  } else if (compare(version, "0.3", ">=")) {
    return VersionsMetapage.V0_3;
  } else {
    // Return something, assume latest
    console.log(
      `Could not match version=${version} to any known version, assuming ${MetapageVersionCurrent}`
    );
    return MetapageVersionCurrent;
  }
};

export const getUrlParam = (key: MetapageHashParams): string | null => {
  if (!window.location.search) {
    return null;
  }
  return new URLSearchParams(window.location.search).get(key);
};

export const getUrlParamDebug = (): boolean => {
  return new URLSearchParams(window.location.search).has(
    MetapageHashParams.mp_debug
  );
};

export const isDebugFromUrlsParams = (): boolean => {
  const param = new URLSearchParams(window.location.search).get(
    MetapageHashParams.mp_debug
  );
  return param === "true" || param === "1";
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
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
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

export const isPageLoaded = (): boolean => {
  return (
    document.readyState == "complete" || document.readyState == "interactive"
  );
  // https://stackoverflow.com/questions/13364613/how-to-know-if-window-load-event-was-fired-already/28093606
  // // TODO ugh casting here but I can't seem to get the right type with the loadEventEnd
  // return window.performance.getEntriesByType("navigation").every((e) => { return (e as PerformanceNavigationTiming).loadEventEnd > 0 });
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
    window.addEventListener("load", () => {
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
