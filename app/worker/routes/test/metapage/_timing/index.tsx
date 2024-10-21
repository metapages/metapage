import { Head } from '$fresh/runtime.ts';
import { PageProps } from '$fresh/server.ts';

export default function MetaframePage(props: PageProps) {
  
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