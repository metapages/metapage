import { Head } from '$fresh/runtime.ts';
import { PageProps } from '$fresh/server.ts';

export default function MetaframePage(props: PageProps) {
  
  return (
    <>
      <Head>
        <meta charset="UTF-8" />
        <title>Metapage tests</title>
      </Head>
    <main>
      <h2>Metapage tests:</h2>
      <br/>
      <ul>
        <li><a href={`./metapage/compatibility`}>Test a metapage@version with all existing metaframe versions</a></li>
        {/* <li><a href={`./metapage/timing`}>Test timing and internal APIs</a></li> */}
      </ul>
    </main>
    </>
  );
}