import fetchRetryWrapper from "fetch-retry";
import { convertMetapageDefinitionToVersion } from "./conversions";
import { MetaframeDefinitionV1, MetapageDefinitionV1 } from "./v1";
import { VersionsMetaframe, VersionsMetapage } from "./versions";
import { MetaframeDefinitionV4, MetapageDefinitionV3 } from "./v0_4";

const fetchRetry = fetchRetryWrapper(fetch);

export const getMetapageDefinitionFromUrl = async (url: string, version: VersionsMetapage): Promise<MetapageDefinitionV1|MetapageDefinitionV3> => {
  const metapageUrl = new URL(url);
  metapageUrl.pathname = metapageUrl.pathname + (metapageUrl.pathname.endsWith("/") ? "metapage.json" : "/metapage.json");
  const response = await fetchRetry(metapageUrl.href, {
    redirect: "follow",
    retries: 3,
    retryDelay: 1000,
  });
  const definition = await response.json();
  const convertedDefinition = await convertMetapageDefinitionToVersion(definition, version);
  return convertedDefinition;
};

export const getMetaframeDefinitionFromUrl = async (url: string, version: VersionsMetaframe): Promise<MetaframeDefinitionV1|MetaframeDefinitionV4> => {
  const metaframeUrl = new URL(url);
  metaframeUrl.pathname = metaframeUrl.pathname + (metaframeUrl.pathname.endsWith("/") ? "metaframe.json" : "/metaframe.json");
  const response = await fetchRetry(metaframeUrl.href, {
    redirect: "follow",
    retries: 3,
    retryDelay: 1000,
  });
  const definition = await response.json();
  return definition;
};