import { convertMetapageDefinitionToVersion } from "./conversions";
import { MetaframeDefinitionV03 } from "./v0_3/all";
import { MetaframeDefinitionV1 } from "./v1";
import { VersionsMetapage } from "./versions";

export const getMetaframeDefinitionFromUrl = async (url: string, version: VersionsMetapage): Promise<MetaframeDefinitionV1|MetaframeDefinitionV03> => {
  const metaframeUrl = new URL(url);
  metaframeUrl.pathname = metaframeUrl.pathname + (metaframeUrl.pathname.endsWith("/") ? "metaframe.json" : "/metaframe.json");
  const response = await fetch(metaframeUrl.href);
  const definition = await response.json();
  const convertedDefinition = await convertMetapageDefinitionToVersion(definition, version);
  return convertedDefinition;
};
