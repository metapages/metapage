import { Head } from '$fresh/runtime.ts';
import { PageProps } from '$fresh/server.ts';

import type { VersionProps } from '../../_types.ts';

const testname = 'timing';

export default function MetaframePage(props: PageProps<VersionProps>) {
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

  return (
    <>
      <Head>
        <meta charset="UTF-8" />
        <title>Metapage test {testname} @ version: {displayVersion}</title>
        <meta
          name="description"
          content="This is a metapage built for testing"
        />
      </Head>
    <main>
      <p>Metapage test {testname} @ version: {displayVersion}</p>
      <div id='status'>status</div>
      <div id='body'></div>
      <script type="module" src={`/metapage-test-${testname}.js`}></script>
    </main>
    </>
  );
}