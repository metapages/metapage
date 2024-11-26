import { compareVersions } from 'compare-versions';
import fetchRetryWrapper from "fetch-retry";
import { create } from 'mutative';

import { MetapageDefinitionV02 } from './v0_2/all.js';
import { MetapageDefinitionV03 } from './v0_3/all.js';
import {
  MetapageDefinitionV1
} from './v1/index.js';
import {
  MetapageVersionCurrent,
  VersionsMetapage,
} from './versions.js';

const fetchRetry = fetchRetryWrapper(fetch);

export const convertMetapageDefinitionToVersion = async (
  def: any | MetapageDefinitionV02 | MetapageDefinitionV03 | MetapageDefinitionV1,
  targetVersion: VersionsMetapage
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

  if (compareVersions(targetVersion, MetapageVersionCurrent) > 0) {
    // The version we are given is from the future, so we need the API to convert it
    try {
      const resp = await fetchRetry(`https://module.metapage.io/conversion/metapage/${targetVersion}`, 
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
      return respBody as MetapageDefinitionV1;
    } catch(err) {
      throw `Error converting metapage definition to version ${targetVersion}: ${err}`;
    }
    
  }

  const targetDefinition = convertMetapageDefinitionToTargetVersionInternal(def, targetVersion);
  return targetDefinition;
};

export const convertMetapageDefinitionToCurrentVersion = async (
  def: any | MetapageDefinitionV02 | MetapageDefinitionV03 | MetapageDefinitionV1
): Promise<MetapageDefinitionV1> => {

  return convertMetapageDefinitionToVersion(def, MetapageVersionCurrent);
};

const convertMetapageDefinitionToTargetVersionInternal = (
  def: any | MetapageDefinitionV02 | MetapageDefinitionV03 | MetapageDefinitionV1,
  targetVersion: VersionsMetapage
): MetapageDefinitionV02 | MetapageDefinitionV03 | MetapageDefinitionV1 => {
  if (!def) {
    throw "Metapage definition null";
  }

  if (!def.version) {
    throw 'Missing "version" key in metapage definition';
  }

  let currentVersion = getMatchingMetapageVersion(def.version);
  if (currentVersion === targetVersion) {
    return def;
  }

  let currentDefinition: MetapageDefinitionV02 | MetapageDefinitionV03 | MetapageDefinitionV1 = def;

  while (currentVersion !== targetVersion) {
    switch (currentVersion) {
      case "0.2": {
        if (compareVersions(targetVersion, currentVersion) > 0) {
          currentDefinition = definition_v0_2_to_v0_3(currentDefinition as MetapageDefinitionV02);
          currentVersion = getMatchingMetapageVersion(currentDefinition.version);
        } else {
          throw `Cannot convert from version ${currentVersion} to ${targetVersion}`;
        }
        break;
      }
      case "0.3": {
        if (compareVersions(targetVersion, currentVersion) > 0) {
          currentDefinition = definition_v0_3_to_v1(currentDefinition as MetapageDefinitionV03);
          currentVersion = getMatchingMetapageVersion(currentDefinition.version);
        } else {
          currentDefinition = definition_v0_3_to_v0_2(currentDefinition as MetapageDefinitionV03);
          currentVersion = getMatchingMetapageVersion(currentDefinition.version);
        }
        break;
      }
      case "1": {
        if (compareVersions(targetVersion, currentVersion) > 0) {
          throw `Cannot convert from version ${currentVersion} to ${targetVersion}, 1 is the latest version`;
        } else {
          currentDefinition = definition_v1_to_v0_3(currentDefinition as MetapageDefinitionV1);
          currentVersion = getMatchingMetapageVersion(currentDefinition.version);
        }
        break;
      }
      default:
        throw `Unknow version ${currentVersion} to ${targetVersion}`; // Latest
    }

  }
  return currentDefinition;
};


const definition_v0_2_to_v0_3 = (
  old: MetapageDefinitionV02
): MetapageDefinitionV03 => {
  return create<MetapageDefinitionV03>(old, (draft: MetapageDefinitionV02) => {
    // Exactly the same except v0.3 has plugins
    draft.version = "0.3";
  });
};

const definition_v0_3_to_v0_2 = (
  old: MetapageDefinitionV03
): MetapageDefinitionV02 => {
  return create<MetapageDefinitionV02>(old, (draft: MetapageDefinitionV03) => {
    // Exactly the same except v0.3 has plugins
    draft.version = "0.2";
  });
};


const definition_v0_3_to_v1 = (
  def: MetapageDefinitionV03
): MetapageDefinitionV1 => {

  return create<MetapageDefinitionV1>(def, (draft) => {
    // We removed plugins in v1
    const castV1 = draft as MetapageDefinitionV03;
    delete castV1.plugins;
    castV1.version = "1";
  });
};

const definition_v1_to_v0_3 = (
  def: MetapageDefinitionV1
): MetapageDefinitionV03 => {

  return create(def, (draft:MetapageDefinitionV1) => {
    // We removed plugins in v1, but we don't need to add them back
    draft.version = "0.3";
    return draft;
  }) as MetapageDefinitionV03;
};

export const getMatchingMetapageVersion = (version: string): VersionsMetapage => {
  if (version === "latest") {
    return MetapageVersionCurrent;
  } else if (compareVersions(version, "0.2") < 0) {
    throw `Unknown version: ${version}`;
  } else if (
    compareVersions(version, "0.2") <= 0 &&
    compareVersions(version, "0.3") < 0
  ) {
    return "0.2";
  } else if (compareVersions(version, "0.3") <= 0) {
    return "0.3";
  } else if (version === "1") {
    return "1";
  } else {
    // Return something, assume latest
    throw `Unknown version: ${version}`;
  }
};