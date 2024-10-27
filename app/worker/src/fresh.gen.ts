// DO NOT EDIT. This file is generated by Fresh.
// This file SHOULD be checked into source version control.
// This file is automatically updated during development when running `dev.ts`.

import * as $_404 from "./routes/_404.tsx";
import * as $_app from "./routes/_app.tsx";
import * as $_coming_soon from "./routes/_coming_soon.tsx";
import * as $api_joke from "./routes/api/joke.ts";
import * as $convert_index from "./routes/convert/index.tsx";
import * as $convert_metaframe_targetversion_ from "./routes/convert/metaframe/[targetversion].tsx";
import * as $convert_metaframe_index from "./routes/convert/metaframe/index.tsx";
import * as $convert_metapage_targetversion_ from "./routes/convert/metapage/[targetversion].tsx";
import * as $convert_metapage_index from "./routes/convert/metapage/index.tsx";
import * as $convert_types from "./routes/convert/types.ts";
import * as $index from "./routes/index.tsx";
import * as $lib_path_ from "./routes/lib/[...path].ts";
import * as $test_types from "./routes/test/_types.ts";
import * as $test_metaframe_compatibility_version_index from "./routes/test/metaframe/compatibility/[version]/index.tsx";
import * as $test_metaframe_compatibility_version_metaframe_json from "./routes/test/metaframe/compatibility/[version]/metaframe.json.ts";
import * as $test_metaframe_compatibility_metaframe_test_compatibility_js from "./routes/test/metaframe/compatibility/metaframe-test-compatibility.js.ts";
import * as $test_metapage_compatibility_version_ from "./routes/test/metapage/compatibility/[version].tsx";
import * as $test_metapage_compatibility_index from "./routes/test/metapage/compatibility/index.tsx";
import * as $test_metapage_compatibility_metapage_test_compatibility_js from "./routes/test/metapage/compatibility/metapage-test-compatibility.js.ts";
import * as $test_metapage_index from "./routes/test/metapage/index.tsx";
import * as $test_metapage_timing_version_ from "./routes/test/metapage/timing/[version].tsx";
import * as $test_metapage_timing_index from "./routes/test/metapage/timing/index.tsx";
import * as $versions_index from "./routes/versions/index.tsx";
import * as $versions_metapages_metapage from "./routes/versions/metapages/metapage.ts";
import * as $Counter from "./islands/Counter.tsx";
import type { Manifest } from "$fresh/server.ts";

const manifest = {
  routes: {
    "./routes/_404.tsx": $_404,
    "./routes/_app.tsx": $_app,
    "./routes/_coming_soon.tsx": $_coming_soon,
    "./routes/api/joke.ts": $api_joke,
    "./routes/convert/index.tsx": $convert_index,
    "./routes/convert/metaframe/[targetversion].tsx":
      $convert_metaframe_targetversion_,
    "./routes/convert/metaframe/index.tsx": $convert_metaframe_index,
    "./routes/convert/metapage/[targetversion].tsx":
      $convert_metapage_targetversion_,
    "./routes/convert/metapage/index.tsx": $convert_metapage_index,
    "./routes/convert/types.ts": $convert_types,
    "./routes/index.tsx": $index,
    "./routes/lib/[...path].ts": $lib_path_,
    "./routes/test/_types.ts": $test_types,
    "./routes/test/metaframe/compatibility/[version]/index.tsx":
      $test_metaframe_compatibility_version_index,
    "./routes/test/metaframe/compatibility/[version]/metaframe.json.ts":
      $test_metaframe_compatibility_version_metaframe_json,
    "./routes/test/metaframe/compatibility/metaframe-test-compatibility.js.ts":
      $test_metaframe_compatibility_metaframe_test_compatibility_js,
    "./routes/test/metapage/compatibility/[version].tsx":
      $test_metapage_compatibility_version_,
    "./routes/test/metapage/compatibility/index.tsx":
      $test_metapage_compatibility_index,
    "./routes/test/metapage/compatibility/metapage-test-compatibility.js.ts":
      $test_metapage_compatibility_metapage_test_compatibility_js,
    "./routes/test/metapage/index.tsx": $test_metapage_index,
    "./routes/test/metapage/timing/[version].tsx":
      $test_metapage_timing_version_,
    "./routes/test/metapage/timing/index.tsx": $test_metapage_timing_index,
    "./routes/versions/index.tsx": $versions_index,
    "./routes/versions/metapages/metapage.ts": $versions_metapages_metapage,
  },
  islands: {
    "./islands/Counter.tsx": $Counter,
  },
  baseUrl: import.meta.url,
} satisfies Manifest;

export default manifest;