import fetchRetryWrapper from "fetch-retry";

import { getHashParamValueJsonFromUrl } from "@metapages/hash-query";

import {
  convertMetaframeDefinitionToVersion,
  convertMetaframeJsonToCurrentVersion,
} from "./conversions-metaframe";
import { convertMetapageDefinitionToVersion } from "./conversions-metapage";
import { MetaframeDefinitionV4 } from "./v0_4";
import { MetaframeDefinitionV1 } from "./v1";
import {
  MetaframeDefinition,
  MetaframeDefinitionV2,
  MetapageDefinition,
} from "./v2";
import {
  MetaframeVersionCurrent,
  MetapageVersionCurrent,
  VersionsMetaframe,
  VersionsMetapage,
} from "./versions";

const fetchRetry = fetchRetryWrapper(fetch);

export const getMetapageDefinitionFromUrl = async (
  url: string,
  version?: VersionsMetapage,
): Promise<MetapageDefinition> => {
  const metapageUrl = new URL(url);
  metapageUrl.pathname =
    metapageUrl.pathname +
    (metapageUrl.pathname.endsWith("/") ? "metapage.json" : "/metapage.json");
  const response = await fetchRetry(metapageUrl.href, {
    redirect: "follow",
    retries: 3,
    retryDelay: 1000,
  });
  const definition = await response.json();
  const convertedDefinition = await convertMetapageDefinitionToVersion(
    definition,
    version || MetapageVersionCurrent,
  );
  return convertedDefinition as MetapageDefinition;
};

export const getMetaframeDefinitionFromUrl = async (
  url: string,
  version?: VersionsMetaframe,
): Promise<
  | MetaframeDefinitionV2
  | MetaframeDefinitionV1
  | MetaframeDefinitionV4
  | MetaframeDefinition
  | undefined
> => {
  // we know some URLs will never provide a definition, so we can skip them
  if (url.startsWith("data:")) {
    return undefined;
  }

  if (url.startsWith("https://docs.google.com")) {
    return undefined;
  }

  const metaframeUrl = new URL(url);
  if (metaframeUrl.origin.endsWith(".notion.site")) {
    return undefined;
  }

  // first try hash param encoded definition
  let urlEncodedDefinition: MetaframeDefinitionV2 | undefined =
    getHashParamValueJsonFromUrl(metaframeUrl, "definition");

  if (urlEncodedDefinition) {
    return convertMetaframeJsonToCurrentVersion(urlEncodedDefinition);
  }

  // not sent to server
  metaframeUrl.hash = "";

  // then try metaframe.json in the url
  if (!metaframeUrl.pathname.endsWith("metaframe.json")) {
    metaframeUrl.pathname =
      metaframeUrl.pathname +
      (metaframeUrl.pathname.endsWith("/")
        ? "metaframe.json"
        : "/metaframe.json");
  }
  try {
    const response = await fetchRetry(metaframeUrl.href, {
      redirect: "follow",
      retries: 3,
      retryDelay: 1000,
    });
    if (response.status !== 200) {
      return undefined;
    }
    const definition = await response.json();
    const convertedDefinition = await convertMetaframeDefinitionToVersion(
      definition,
      version || MetaframeVersionCurrent,
    );
    return convertedDefinition;
  } catch (error) {
    console.error(
      `Error fetching metaframe definition from ${metaframeUrl.href.substring(0, 200)}`,
      error,
    );
    return undefined;
  }
};

export const isEmptyMetaframeDefinition = (
  definition?:
    | MetaframeDefinitionV1
    | MetaframeDefinitionV2
    | MetaframeDefinitionV4,
): boolean => {
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
