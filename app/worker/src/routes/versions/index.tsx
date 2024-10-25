import { Head } from '$fresh/runtime.ts';

export default function Home() {
  return (
    <>
      <Head>
        <meta charset="UTF-8" />
        <title>Versions</title>
        <meta
          name="description"
          content="Versions of the libraries and objects"
        />
      </Head>
        <h2>Versions</h2>
        <br/>
        <ul>
          <li><a href="/versions/metapages/metapage">@metapages/metapage</a></li>
        </ul>
    </>
  );
}