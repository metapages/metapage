import { compare } from 'compare-versions';
import stringify from 'fast-json-stable-stringify';
import { create } from 'mutative';
import { MetapageHashParams } from './Shared';
import { MetapageDefinition as MetapageDefinitionV02 } from './v0_2/all';
import { MetapageDefinition as MetapageDefinitionV03 } from './v0_3/all';
import {
  MetaframeDefinitionV4,
  MetaframeDefinitionV5,
  MetaframeDefinitionV6,
  MetaframeEditTypeMetaframe,
  MetaframeEditTypeMetapage,
  MetaframeEditTypeMetapageV6,
  MetaframeEditTypeUrlV6,
  MetaframeMetadataV4,
  MetaframeMetadataV5,
  MetaframeMetadataV6,
} from './v0_4';
import {
  MetaframeDefinitionV1,
  MetaframeId,
  MetaframeInputMap,
  MetapageDefinitionV1,
  MetapageId,
  MetapageVersionCurrent,
  VersionsMetapage,
} from './v1';

export const convertMetapageDefinitionToCurrentVersion = (
  def: any | MetapageDefinitionV02 | MetapageDefinitionV03 | MetapageDefinitionV1
): MetapageDefinitionV1 => {
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
  let updatedDefinition: MetapageDefinitionV1;

  switch (getMatchingVersion(def.version)) {
    case "0.2": {
      updatedDefinition = convertMetapageDefinitionToCurrentVersion(
        definition_v0_2_to_v0_3(def as MetapageDefinitionV02)
      );
      break;
    }
    case "0.3": {
      updatedDefinition = convertMetapageDefinitionToCurrentVersion(
        definition_v0_3_to_v1(def as MetapageDefinitionV03)
      );
      break;
    }
    case "1": {
      updatedDefinition = def as MetapageDefinitionV1; // Latest
      break;
    }
    default: // Latest
      console.warn(
        `Metapage definition version=${def.version} but we only know up to version ${MetapageVersionCurrent}. Assuming the definition is compatible, but it's the future!`
      );
      updatedDefinition = def as MetapageDefinitionV1;
      break;
  }
  return create(updatedDefinition, (draft) => draft);
};

export const convertMetaframeJsonToCurrentVersion = (
  m:
    | MetaframeDefinitionV4
    | MetaframeDefinitionV5
    | MetaframeDefinitionV6
    | MetaframeDefinitionV1
    | undefined,
  opts?: { errorIfUnknownVersion?: boolean }
): MetaframeDefinitionV1 | undefined => {
  if (!m) {
    return undefined;
  }
  switch (m.version) {
    case undefined:
    case "0.3":
    case "0.4":
      return convertMetaframeJsonToCurrentVersion(
        convertMetaframeJsonV5ToV1(convertMetaframeJsonV4ToV5(m as MetaframeDefinitionV4))
      );
    case "0.5":
      return convertMetaframeJsonV5ToV1(m as MetaframeDefinitionV5);
    case "0.6":
      return convertMetaframeJsonV6ToV1(m as MetaframeDefinitionV6);
    case "1":
      return m as MetaframeDefinitionV1;
    default:
      if (opts && opts.errorIfUnknownVersion) {
        throw `Unsupported metaframe version. Please upgrade to a new version: npm i @metapages/metapage@latest\n ${JSON.stringify(
          m
        )}\n${window.location.href}`;
      } else {
        console.error(
          `Unsupported metaframe version. Not throwing an error because you might not be able to upgrade. Please upgrade to a new version: npm i @metapages/metapage@latest\n ${JSON.stringify(
            m
          )}\n${window.location.href}`
        );
        return m as MetaframeDefinitionV1;
      }
  }
};

const convertMetaframeJsonV4ToV5 = (source: MetaframeDefinitionV4) => {
  const {
    version,
    inputs,
    outputs,
    allow,
    metadata,
    ...restOfDefinitionProps
  } = source;
  const metadataV4: MetaframeMetadataV4 = metadata;
  const {
    title,
    author,
    image,
    descriptionUrl,
    keywords,
    iconUrl,
    ...restOfMetadataProps
  } = metadataV4;

  const metadataV5: MetaframeMetadataV5 = {
    name: title,
    author,
    description: descriptionUrl,
    image,
    tags: keywords,
    ...restOfMetadataProps,
  };

  const metaframeDefV5: MetaframeDefinitionV5 = {
    version: "0.5",
    inputs: inputs,
    outputs: outputs,
    allow: allow,
    metadata: metadataV5,
    ...restOfDefinitionProps,
  };
  return metaframeDefV5;
};

// The only difference between v5 and v6 is the metadata operations field
const convertMetaframeJsonV6ToV1 = (source: MetaframeDefinitionV6) => {
  return source as MetaframeDefinitionV1;
}

// The only difference between v5 and v6 is the metadata operations field
const convertMetaframeJsonV5ToV1 = (source: MetaframeDefinitionV5) => {
  return convertMetaframeJsonV6ToV1(convertMetaframeJsonV5ToV6(source));
}
// The only difference between v5 and v6 is the metadata operations field
const convertMetaframeJsonV5ToV6 = (source: MetaframeDefinitionV5) => {
  // Process the metadata separately
  return create<MetaframeDefinitionV6>(source, (draft: MetaframeDefinitionV5) => {

    const { metadata, ...restOfDefinitionProps } = draft;

    // apart from metadata, the rest of the definition is the same as v5
    const metaframeDefV6: MetaframeDefinitionV6 = {
      ...restOfDefinitionProps,
      version: "0.6",
    };

    if (metadata) {
      const { edit, ...restOfMetadataProps } = metadata;
      const metaframeMetaV6: MetaframeMetadataV6 = { ...restOfMetadataProps };
      metaframeDefV6.metadata = metaframeMetaV6;

      if (edit && !(metaframeMetaV6 && metaframeMetaV6.operations && metaframeMetaV6.operations.edit)) {
        if (!metaframeMetaV6.operations) {
          metaframeMetaV6.operations = {};
        }

        switch (edit.type) {
          case "metapage":
            const metaPageEditPreviousMetapage =
              edit.value as MetaframeEditTypeMetapage;
            const editOperationMetapage: MetaframeEditTypeMetapageV6 = {
              type: "metapage",
              metapage: metaPageEditPreviousMetapage.definition,
              metaframe: metaPageEditPreviousMetapage.key || "edit",
            };

            metaframeMetaV6.operations.edit = editOperationMetapage;
            break;

          case "metaframe":
            const metaPageEditPreviousMetaframe =
              edit.value as MetaframeEditTypeMetaframe;
            const editOperationMetaframe: MetaframeEditTypeUrlV6 = {
              type: "url",
              url: metaPageEditPreviousMetaframe.url,
              params: metaPageEditPreviousMetaframe.params
                ? metaPageEditPreviousMetaframe.params.map((p) => ({
                  to: p.to,
                  from: p.from,
                  // path doesn't work, how can we know where to put the path token?
                  toType: p.toType === "path" ? undefined : p.toType,
                }))
                : undefined,
            };
            metaframeMetaV6.operations.edit = editOperationMetaframe;
            break;
          default:
            throw `Unsupported edit type: ${edit.type
            } in metadata for metaframe ${JSON.stringify(metadata)}`;
        }
      }
    }

    return metaframeDefV6;
  });
};

const definition_v0_2_to_v0_3 = (
  old: MetapageDefinitionV02
): MetapageDefinitionV03 => {
  return create<MetapageDefinitionV03>(old, (draft: MetapageDefinitionV02) => {
    // Exactly the same except v0.3 has plugins
    draft.version = "0.3";
  });
};

const definition_v0_3_to_v1 = (
  old: MetapageDefinitionV03
): MetapageDefinitionV1 => {

  return create<MetapageDefinitionV1>(old, (draft) => {
    // We removed plugins in v1
    const castV1 = draft as MetapageDefinitionV03;
    delete castV1.plugins;
  });
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
    compare(version, "0.3", "<")
  ) {
    return "0.2";
  } else if (compare(version, "0.3", "<=")) {
    return "0.3";
  } else if (version === "1") {
    return "1";
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

export const metapageAllSha256Hash = async (metapage: MetapageDefinitionV1) => {
  const metapageStr = stringify(metapage);
  return await sha256ToBase64(metapageStr);
}

export const metapageOnlyEssentailSha256Hash = async (metapage: Pick<MetapageDefinitionV1, "metaframes" | "version">) => {
  const metapageStr = stringify({
    version: metapage.version,
    metaframes: metapage.metaframes,
  });
  return await sha256ToBase64(metapageStr);
}

async function sha256ToBase64(str: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}
