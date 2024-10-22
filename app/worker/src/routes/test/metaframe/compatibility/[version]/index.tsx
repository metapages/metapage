import { Head } from '$fresh/runtime.ts';
import {
  PageProps,
  RouteConfig,
} from '$fresh/server.ts';

export const config: RouteConfig = {
  skipAppWrapper: true, // Skip the app wrapper during rendering
};


export default function MetaframePage(props: PageProps<>) {
  let { version } = props.params;
  if (version.startsWith('latest')) {
      // it can be versionLatest in the URL header but the internal VERSION must then be 'latest';
      version = 'latest';
  }

  return (
    <>
      <Head>
        <meta charset="UTF-8" />
        <title>Metaframe v{version} for testing</title>
        <meta
          name="description"
          content="This is a metaframe built for testing"
        />
        <script src="/compare-versions-3.4.0.js"></script>
      </Head>
    <main>
      <p>metaframe v{version}!</p>
      <div id='body'></div>
      <div id='status'></div>
      <script type="module" src={`/metaframe-test-compatibility.js`}></script>
    </main>
    </>
  );
}