import { Head } from "fresh/runtime";
import { page } from "fresh";

import { getAllMetapageVersions } from "../../../../util/version-tools.ts";
import { define } from "../../../../utils.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const urlPathElements = ctx.url.pathname.split("/").filter((e) => e !== "");
    const testname = urlPathElements[2];

    const versions = await getAllMetapageVersions();
    versions.unshift("latest");
    return page({ versions, testname });
  },
});

export default define.page<typeof handler>(function MetaframePage(props) {
  return (
    <>
      <Head>
        <meta charset="UTF-8" />
        <title>Metapage test: {props.data.testname}</title>
      </Head>
      <main>
        <h2>Metapage test: {props.data.testname}</h2>
        <br />
        <a href="https://app.metapage.io/dion/metapages-module-test-io-pipe-names-6a97801b3eed4b3d9d6f5d24b508f324?view=default">
          Source metapage
        </a>
        <br />
        <br />
        <p>Choose version:</p>
        <br />
        {props.data.versions.map((version) => (
          <>
            <a href={`./${props.data.testname}/${version}`}>{version}</a>
            <br />
          </>
        ))}
      </main>
    </>
  );
});
