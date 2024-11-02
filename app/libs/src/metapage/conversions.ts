import { compareVersions } from 'compare-versions';
import { create } from 'mutative';

import { MetapageDefinitionV02 } from './v0_2/all.js';
import { MetapageDefinitionV03 } from './v0_3/all.js';
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
} from './v0_4/index.js';
import {
  MetaframeDefinitionV1,
  MetapageDefinitionV1,
} from './v1/index.js';
import {
  MetapageVersionCurrent,
  VersionsMetapage,
} from './versions.js';

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

  if (compareVersions(def.version, targetVersion) > 0) {
    // The version we are given is from the future, so we need the API to convert it
    try {
      const resp = await fetch(`https://module.metapage.io/conversion/metapage/${targetVersion}`, 
        {
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
                ? metaPageEditPreviousMetaframe.params.map((p:any) => ({
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
