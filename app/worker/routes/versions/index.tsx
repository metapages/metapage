import { Head } from "$fresh/runtime.ts";

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
      <div class="p-4 mx-auto max-w-screen-md">
        <h1>Versions</h1>
        <ul>
          <li><a href="/versions/metapages/metapage">@metapages/metapage</a></li>
        </ul>
      </div>
    </>
  );
}