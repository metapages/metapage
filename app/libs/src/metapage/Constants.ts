import {
  MetaframeVersionsAll,
  MetapageVersionsAll,
} from './v0_4';

export const METAFRAME_JSON_FILE = "metaframe.json";
/**
 * TODO: obsolete? This was used by plugins, which have been removed.
 */
export const METAPAGE_KEY_DEFINITION = "metapage/definition";
/**
 * TODO: obsolete? This was used by plugins, which have been removed.
 */
export const METAPAGE_KEY_STATE = "metapage/state";

export const VERSION_METAPAGE = MetapageVersionsAll[MetapageVersionsAll.length - 1];
export const VERSION_METAFRAME = MetaframeVersionsAll[MetaframeVersionsAll.length - 1];
