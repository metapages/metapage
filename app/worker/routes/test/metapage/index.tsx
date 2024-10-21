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
      <h1>Metapage tests:</h1>
      <br/>
      <ul>
        <li><a href={`./metapage/compatibility`}>Test all (non-deprecated) metaframe versions with this metapage version</a></li>
        <li><a href={`./metapage/timing`}>Test timing and internal APIs</a></li>
      </ul>
    </main>
    </>
  );
}