import { Head } from '$fresh/runtime.ts';
import { PageProps } from '$fresh/server.ts';

import type { VersionProps } from '../../_types.ts';

export default function MetaframePage(props: PageProps<VersionProps>) {
  let { version } = props.params;
  
  // Extract testname from URL path
  const testname = props.url.pathname.split('/').slice(-2)[0];
  
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

  return (
    <>
      <Head>
        <meta charset="UTF-8" />
        <title>Metapage test {testname} @ version: {displayVersion}</title>
        <script src="https://unpkg.com/compare-versions/lib/umd/index.js"></script>
      </Head>
    <main>
      <p>Metapage test {testname} @ version: {displayVersion}</p>
      <a href="https://app.metapage.io/dion/metapage-npm-library-debug-early-messages-missed-e59b3aa35806425d80cff197f3e19da0?view=default">Source metapage</a>
      <div id='status'>status</div>
      <div id='body'></div>
      <script type="module" src={`/test/metapage/${testname}/metapage-test.js`}></script>
    </main>
    </>
  );
}