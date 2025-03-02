import { compareVersions } from 'compare-versions';
import { create } from 'mutative';
import fetchRetryWrapper from "fetch-retry";
import { type MetaframeDefinitionV03 } from './v0_3/all.js';
import {
  MetaframeDefinitionV4,
  MetaframeDefinitionV5,
  MetaframeDefinitionV6,
} from './v0_4/index.js';
import {
  MetaframeDefinitionV1,
} from './v1/index.js';
import {
MetaframeVersionCurrent,
  type VersionsMetaframe,
} from './versions.js';
import { MetaframeDefinitionV2 } from './v2/metaframe.js';

const fetchRetry = fetchRetryWrapper(fetch);

type AnyMetaframeDefinition = MetaframeDefinitionV03 | MetaframeDefinitionV4 | MetaframeDefinitionV5 | MetaframeDefinitionV6 | MetaframeDefinitionV1 | MetaframeDefinitionV2;

export const convertMetaframeDefinitionToVersion = async (
  def: any | AnyMetaframeDefinition,
  targetVersion: VersionsMetaframe
): Promise<any> => {
  if (!def) {
    throw "Metapage definition null";
  }

  if (!def.version) {
    throw 'Missing "version" key in metapage definition';
  }
  if (!targetVersion) {
    throw 'Missing "version" argument';
  }

  if (compareVersions(targetVersion, MetaframeVersionCurrent) > 0) {
    // The version we are given is from the future, so we need the API to convert it
    try {
      const resp = await fetchRetry(`https://module.metapage.io/conversion/metaframe/${targetVersion}`, 
        {
          redirect: "follow",
          retries: 3,
          retryDelay: 1000,
          method: "POST",
          body: JSON.stringify(def),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const respBody = await resp.json();
      return respBody as MetaframeDefinitionV2;
    } catch(err) {
      throw `Error converting metapage definition to version ${targetVersion}: ${err}`;
    }
    
  }

  const targetDefinition = convertMetaframeDefinitionToTargetVersionInternal(def, targetVersion);
  return targetDefinition;
};

export const convertMetaframeDefinitionToCurrentVersion = async (
  def: any | AnyMetaframeDefinition
): Promise<MetaframeDefinitionV1> => {
  return convertMetaframeDefinitionToVersion(def, MetaframeVersionCurrent);
};

const convertMetaframeDefinitionToTargetVersionInternal = (
  def: any | AnyMetaframeDefinition,
  targetVersion: VersionsMetaframe
): AnyMetaframeDefinition => {
  if (!def) {
    throw "Metaframe definition null";
  }

  if (!def.version) {
    // we assume this is an older version of the definition
    // that does not have the version key
    def = create(def, (draft :MetaframeDefinitionV03) => {
      draft.version = "0.3";
    }) as MetaframeDefinitionV6;
  }

  let currentVersion = getMatchingMetaframeVersion(def.version);
  if (currentVersion === targetVersion) {
    return def;
  }

  let currentDefinition:AnyMetaframeDefinition = def;

  // ["0.3", "0.4", "0.5", "0.6", "1", "2"]
  while (currentVersion !== targetVersion) {
    switch (currentVersion) {
      case "0.3": {
        if (compareVersions(targetVersion, currentVersion) > 0) {
          currentDefinition = definition_v0_3_to_v0_4(currentDefinition as MetaframeDefinitionV03);
          currentVersion = getMatchingMetaframeVersion(currentDefinition.version);
        } else {
          throw `Cannot convert from version ${currentVersion} to ${targetVersion}`;
        }
        break;
      }
      case "0.4": {
        if (compareVersions(targetVersion, currentVersion) > 0) {
          currentDefinition = definition_v0_4_to_v0_5(currentDefinition as MetaframeDefinitionV4);
          currentVersion = getMatchingMetaframeVersion(currentDefinition.version);
        } else {
          currentDefinition = definition_v0_4_to_v0_3(currentDefinition as MetaframeDefinitionV4);
          currentVersion = getMatchingMetaframeVersion(currentDefinition.version);
        }
        break;
      }
      case "0.5": {
        if (compareVersions(targetVersion, currentVersion) > 0) {
          currentDefinition = definition_v0_5_to_v0_6(currentDefinition as MetaframeDefinitionV5);
          currentVersion = getMatchingMetaframeVersion(currentDefinition.version);
        } else {
          currentDefinition = definition_v0_5_to_v0_4(currentDefinition as MetaframeDefinitionV5);
          currentVersion = getMatchingMetaframeVersion(currentDefinition.version);
        }
        break;
      }
      case "0.6": {
        if (compareVersions(targetVersion, currentVersion) > 0) {
          currentDefinition = definition_v0_6_to_v1(currentDefinition as MetaframeDefinitionV6);
          currentVersion = getMatchingMetaframeVersion(currentDefinition.version);
        } else {
          currentDefinition = definition_v0_6_to_v0_5(currentDefinition as MetaframeDefinitionV6);
          currentVersion = getMatchingMetaframeVersion(currentDefinition.version);
        }
        break;
      }
        case "1": {
          if (compareVersions(targetVersion, currentVersion) > 0) {
            currentDefinition = definition_v1_to_v2(currentDefinition as MetaframeDefinitionV1);
            currentVersion = getMatchingMetaframeVersion(currentDefinition.version);
          } else {
            currentDefinition = definition_v1_to_v0_6(currentDefinition as MetaframeDefinitionV1);
            currentVersion = getMatchingMetaframeVersion(currentDefinition.version);
          }
          break;
        }
      case "2": {
        if (compareVersions(targetVersion, currentVersion) > 0) {
          throw `Cannot convert from version ${currentVersion} to ${targetVersion}`;
        } else {
          currentDefinition = definition_v2_to_v1(currentDefinition as MetaframeDefinitionV2);
          currentVersion = getMatchingMetaframeVersion(currentDefinition.version);
        }
        break;
      }
      default:
        throw `Unknow version ${currentVersion} to ${targetVersion}`; // Latest
    }

  }
  return currentDefinition;
};

export const convertMetaframeJsonToCurrentVersion = async (
  m: AnyMetaframeDefinition | undefined,
  // deprecated
  opts?: { errorIfUnknownVersion?: boolean }
): Promise<MetaframeDefinitionV2 | undefined> => {
  if (!m) {
    return;
  }
  return convertMetaframeDefinitionToCurrentVersion(m);
};

const definition_v0_4_to_v0_3 = (def: MetaframeDefinitionV4) => {
  return create(def, (draft :MetaframeDefinitionV4) => {
    draft.version = "0.3";
    delete draft.allow;
  }) as MetaframeDefinitionV03;
};

const definition_v0_3_to_v0_4 = (def: MetaframeDefinitionV03) => {
  return create(def, (draft :MetaframeDefinitionV03) => {
    draft.version = "0.4";
  }) as MetaframeDefinitionV4;
};

const definition_v0_4_to_v0_5 = (def: MetaframeDefinitionV4) => {
  return create(def, (draft :MetaframeDefinitionV4) => {
    draft.version = "0.5";
    if (!draft?.metadata) {
      return;
    }
    const title = draft.metadata.title;
    delete draft.metadata.title;
    (draft as MetaframeDefinitionV5).metadata!.name = title;

    const descriptionUrl = draft.metadata.descriptionUrl;
    delete draft.metadata.descriptionUrl;
    (draft as MetaframeDefinitionV5).metadata!.description = descriptionUrl;

    const keywords = draft.metadata.keywords;
    delete draft.metadata.keywords;
    (draft as MetaframeDefinitionV5).metadata!.tags = keywords;

  }) as MetaframeDefinitionV1;
};

const definition_v0_5_to_v0_4 = (def: MetaframeDefinitionV5) => {
  return create(def, (draft :MetaframeDefinitionV5) => {
    draft.version = "0.4";
    if (!draft?.metadata) {
      return;
    }
    const name = draft.metadata.name;
    delete draft.metadata.name;
    (draft as MetaframeDefinitionV4).metadata.title = name;

    const decription = draft.metadata.description;
    delete draft.metadata.description;
    (draft as MetaframeDefinitionV4).metadata.descriptionUrl = decription;

    const tags = draft.metadata.tags;
    delete draft.metadata.tags;
    (draft as MetaframeDefinitionV4).metadata.keywords = tags;

  }) as MetaframeDefinitionV4;
};

// v0.6 and v1 are identical, but remove the operations field
const definition_v0_6_to_v1 = (def: MetaframeDefinitionV6) :MetaframeDefinitionV1 => {
  return create(def, (draft: MetaframeDefinitionV6) => {
    draft.version = "1";
    if (draft?.metadata?.operations) {
      delete draft.metadata.operations;
    }
  }) as MetaframeDefinitionV1;
}

// v0.6 and v1 are identical
const definition_v1_to_v0_6 = (def: MetaframeDefinitionV1) :MetaframeDefinitionV6 => {
  return create(def, (draft: MetaframeDefinitionV1) => {
    draft.version = "0.6";
    if (draft?.metadata?.operations) {
      delete draft.metadata.operations;
    }
  }) as MetaframeDefinitionV6;
}

const definition_v2_to_v1 = (def: MetaframeDefinitionV2) :MetaframeDefinitionV1 => {
  return create(def, (draft: MetaframeDefinitionV2) => {
    draft.version = "1";
    if (draft?.metadata?.authors) {
      // ugh we lose information here, but it's the best we can do
      (draft as MetaframeDefinitionV1).metadata.author = draft?.metadata?.authors[0];
      delete draft.metadata.authors;
    }
    return draft;
  }) as MetaframeDefinitionV1;
}

const definition_v1_to_v2 = (def: MetaframeDefinitionV1) :MetaframeDefinitionV2 => {
  return create(def, (draft: MetaframeDefinitionV1) => {
    draft.version = "2";
    if (draft?.metadata?.author) {
      // ugh we lose information here, but it's the best we can do
      (draft as MetaframeDefinitionV2).metadata.authors = [draft.metadata.author];
      delete draft.metadata.author;
    }
    return draft;
  }) as MetaframeDefinitionV2;
}

// The only difference between v5 and v6 is the metadata operations field
// which we are not using in any of those versions, its too new and not stable
// and not documented.
const definition_v0_5_to_v0_6 = (source: MetaframeDefinitionV5) :MetaframeDefinitionV6 => {
  return create(source, (draft: MetaframeDefinitionV5) => {
    draft.version = "0.6";
    if ((draft as MetaframeDefinitionV6)?.metadata?.operations) {
      delete (draft as MetaframeDefinitionV6).metadata!.operations;
    }
  }) as MetaframeDefinitionV6;
};

// The only difference between v5 and v6 is the metadata operations field
// which we are not using in any of those versions, its too new and not stable
// and not documented.
const definition_v0_6_to_v0_5 = (source: MetaframeDefinitionV6) :MetaframeDefinitionV5 => {
  return create<MetaframeDefinitionV5>(source, (draft: MetaframeDefinitionV6) => {
    draft.version = "0.5";
    if (draft?.metadata?.operations) {
      delete draft.metadata.operations;
    }
  });
};

// ["0.3", "0.4", "0.5", "0.6", "1"]
export const getMatchingMetaframeVersion = (version: string): VersionsMetaframe => {
  if (version === "latest") {
    return MetaframeVersionCurrent;
  } else if (compareVersions(version, "0.3") < 0) {
    throw `Unknown version: ${version}`;
  } else if (compareVersions(version, "0.3") <= 0) {
    return "0.3";
  } else if (compareVersions(version, "0.4") <= 0) {
    return "0.4";
  } else if (compareVersions(version, "0.5") <= 0) {
    return "0.5";
  } else if (compareVersions(version, "0.6") <= 0) {
    return "0.6";
  } else if (compareVersions(version, "1") <= 0) {
    return "1";
  } else if (version === "2") {
    return "2";
  } else {
    // Return something, assume latest
    throw `Unknown version: ${version}`;
  }
};
