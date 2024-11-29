import fetchRetryWrapper from "fetch-retry";
import { convertMetapageDefinitionToVersion } from "./conversions-metapage";
import { MetaframeDefinitionV1, MetapageDefinitionV1 } from "./v1";
import { VersionsMetaframe, VersionsMetapage } from "./versions";
import { MetaframeDefinitionV4, MetapageDefinitionV3 } from "./v0_4";
import { convertMetaframeDefinitionToVersion } from "./conversions-metaframe";

const fetchRetry = fetchRetryWrapper(fetch);

export const getMetapageDefinitionFromUrl = async (url: string, version?: VersionsMetapage): Promise<MetapageDefinitionV1|MetapageDefinitionV3> => {
  const metapageUrl = new URL(url);
  metapageUrl.pathname = metapageUrl.pathname + (metapageUrl.pathname.endsWith("/") ? "metapage.json" : "/metapage.json");
  const response = await fetchRetry(metapageUrl.href, {
    redirect: "follow",
    retries: 3,
    retryDelay: 1000,
  });
  const definition = await response.json();
  const convertedDefinition = await convertMetapageDefinitionToVersion(definition, version || "1");
  return convertedDefinition;
};

export const getMetaframeDefinitionFromUrl = async (url: string, version?: VersionsMetaframe): Promise<MetaframeDefinitionV1|MetaframeDefinitionV4> => {
  const metaframeUrl = new URL(url);
  metaframeUrl.pathname = metaframeUrl.pathname + (metaframeUrl.pathname.endsWith("/") ? "metaframe.json" : "/metaframe.json");
  const response = await fetchRetry(metaframeUrl.href, {
    redirect: "follow",
    retries: 3,
    retryDelay: 1000,
  });
  const definition = await response.json();
  const convertedDefinition = await convertMetaframeDefinitionToVersion(definition, version || "1");
  return convertedDefinition;
};

export const isEmptyMetaframeDefinition = (definition?: MetaframeDefinitionV1|MetaframeDefinitionV4): boolean => {
  if (!definition) {
    return true;
  }
  if (definition?.inputs && Object.keys(definition.inputs).length > 0) {
    return false;
  }
  if (definition?.outputs && Object.keys(definition.outputs).length > 0) {
    return false;
  }
  if (definition?.allow) {
    return false;
  }
  if (definition?.metadata && Object.keys(definition.metadata).length > 0) {
    return false;
  }
  return true;
};
