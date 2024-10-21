import { PageProps } from "$fresh/server.ts";
import {
  compare,
  parse
} from "@std/semver";
import { Head } from "$fresh/runtime.ts";

export default function MetaframePage(props: PageProps) {
  let { version } = props.params;
  // the URL param version=latest-begin is a way of having
  // the same metaframe/plugin in multiple places without
  // id/key collisions. The actual version of 'latest-begin'
  // is 'latest' which we check below, but we want to display
  // the version given
  const displayVersion = version;

  if (version.startsWith('latest')) {
      // it can be versionLatest in the URL header but the internal VERSION must then be 'latest';
      version = 'latest';
  }

  let metapageScriptSrc = "";
  if (version === 'latest') {
    metapageScriptSrc = `/metapage/index.js`;
} else {
    // The passed in semver version string can be appended with "-<stuff>"
    const versionForUrl = version.split("-")[0];
    console.log('versionForUrl', versionForUrl);
    if (compare(parse(versionForUrl), parse('0.16.0')) >= 0) {
        metapageScriptSrc = `https://cdn.jsdelivr.net/npm/@metapages/metapage@${versionForUrl}`;
    } else if (compare(parse(versionForUrl), parse('0.11.0')) >= 0) {
        metapageScriptSrc = `https://cdn.jsdelivr.net/npm/@metapages/metapage@${versionForUrl}/dist/browser/metaframe/index.js`;
    } else if (compare(parse(versionForUrl), parse('0.8.0')) >= 0) {
        metapageScriptSrc = `https://cdn.jsdelivr.net/npm/@metapages/metapage@${versionForUrl}/browser/metaframe/index.js`;
    } else if (compare(parse(versionForUrl), parse('0.5.5')) === 0) {
        metapageScriptSrc = `https://cdn.jsdelivr.net/npm/@metapages/metapage-backup@${versionForUrl}/browser/metaframe/index.js`;
    } else if (compare(parse(versionForUrl), parse('0.5.0')) >= 0) {
        metapageScriptSrc = `https://cdn.jsdelivr.net/npm/@metapages/metapage@${versionForUrl}/browser/metaframe/index.js`;
    } else if (compare(parse(versionForUrl), parse('0.4.100')) >= 0) {
        metapageScriptSrc = `https://cdn.jsdelivr.net/npm/metaframe@${versionForUrl}/browser/index.js`;
    } else {
        metapageScriptSrc = `https://cdn.jsdelivr.net/npm/metaframe@${versionForUrl}/browser${debug ? '' : '.min'}.js`;
    }
}

  return (
    <>
      <Head>
        <meta charset="UTF-8" />
        <title>Metapage v{displayVersion} for testing</title>
        <meta
          name="description"
          content="This is a metaframe built for testing"
        />
        {/* <script type="module" src={metapageScriptSrc}></script> */}
      </Head>
    <main>
      <p>metapage v{displayVersion} / {version}!</p>
      <div id='body'></div>
      <div id='status'></div>
      <script type="module" src={`/metapage-test-runner.js`}></script>
    </main>
    </>
  );
}