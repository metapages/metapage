import { Head } from '$fresh/runtime.ts';
import { PageProps } from '$fresh/server.ts';

import type { VersionProps } from '../../_types.ts';

export default function MetaframePage(props: PageProps<VersionProps>) {
  let { version } = props.params;

  // Extract testname from URL path
  const testname = props.url.pathname.split('/').slice(-2)[0];

  const displayVersion = version;

  if (version.startsWith('latest')) {
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
      <div id='status'>status</div>
      <div id='body'></div>
      <script type="module" src={`/test/metapage/${testname}/metapage-test.js`}></script>
    </main>
    </>
  );
}
