import fetchRetryWrapper from "fetch-retry";
import { convertMetapageDefinitionToVersion } from "./conversions";
import { MetaframeDefinitionV03 } from "./v0_3/all";
import { MetaframeDefinitionV1 } from "./v1";
import { VersionsMetapage } from "./versions";

const fetchRetry = fetchRetryWrapper(fetch);

export const getMetaframeDefinitionFromUrl = async (url: string, version: VersionsMetapage): Promise<MetaframeDefinitionV1|MetaframeDefinitionV03> => {
  const metaframeUrl = new URL(url);
  metaframeUrl.pathname = metaframeUrl.pathname + (metaframeUrl.pathname.endsWith("/") ? "metaframe.json" : "/metaframe.json");
  const response = await fetchRetry(metaframeUrl.href, {
    redirect: "follow",
    retries: 3,
    retryDelay: 1000,
  });
  const definition = await response.json();
  const convertedDefinition = await convertMetapageDefinitionToVersion(definition, version);
  return convertedDefinition;
};
