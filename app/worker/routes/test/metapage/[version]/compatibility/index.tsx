import { PageProps } from "$fresh/server.ts";
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

  return (
    <>
      <Head>
        <meta charset="UTF-8" />
        <title>Metapage v{displayVersion} for testing</title>
        <meta
          name="description"
          content="This is a metapage built for testing"
        />
        <script src="/compare-versions-3.4.0.js"></script>
      </Head>
    <main>
      <p>Test metapage version: {displayVersion}</p>
      <div id='body'></div>
      <div id='status'>status</div>
      <script type="module" src={`/metapage-test-runner.js`}></script>
    </main>
    </>
  );
}