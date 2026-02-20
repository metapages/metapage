import { Head } from '$fresh/runtime.ts';
import { PageProps } from '$fresh/server.ts';

export default function ConvertPage(props: PageProps) {
  return (
    <>
      <Head>
        <meta charset="UTF-8" />
        <title>Data conversion</title>
      </Head>
      <main>
        <h2>Convert configuration versions</h2>
        <br />
        <p>
          A metapage must be compatible with all previous AND all future
          metaframe versions. To solve this, we provide a durable service that
          converts any metapage or metaframe definition to any other version.
        </p>
        <br />
        <ul>
          <li>
            <a href={`convert/metapage`}>Convert metapage definition</a>
          </li>
          <li>
            <a href={`convert/metaframe`}>Convert metaframe definition</a>
          </li>
        </ul>
      </main>
    </>
  );
}
