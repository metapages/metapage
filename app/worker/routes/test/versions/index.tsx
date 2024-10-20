import { Head } from "$fresh/runtime.ts";

export default function Home() {
  return (
    <>
      <Head>
        <meta charset="UTF-8" />
        <title>Test Metapage Versions</title>
        <meta
          name="description"
          content="This is a brief description of Fresh"
        />
        <link rel="stylesheet" href="styles.css" />
        <script type="module" src="https://cdn.jsdelivr.net/npm/@metapages/metapage@0.13.10-alpha1/dist/index.mjs"></script>
      </Head>
      <div class="p-4 mx-auto max-w-screen-md">
        <h1>Hello World</h1>
      </div>
    </>
  );
}