
import { PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";

export default function ConvertPage(props: PageProps) {

  return (
    <>
      <Head>
        <meta charset="UTF-8" />
        <title>Metapage published versions</title>
        <meta
          name="description"
          content="List metapage versions"
        />
      </Head>
      <main>
        <h2>Metapage published versions</h2>
        <br/>
        <ul>
          <li><a href={`./metapage`}>Convert metapage definition</a></li>
          <li><a href={`./metaframe`}>Convert metaframe definition</a></li>
        </ul>
      </main>
    </>
  );
}


