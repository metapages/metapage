import { Head } from "fresh/runtime";
import { page } from "fresh";

import { getAllMetapageVersions } from "../../../../util/version-tools.ts";
import { define } from "../../../../utils.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const urlPathElements = ctx.url.pathname
      .split("/")
      .filter((e) => e !== "");
    const testname = urlPathElements[2];
    const versions = await getAllMetapageVersions();
    const isDevelopment = !Deno.env.get("DENO_DEPLOYMENT_ID");
    if (isDevelopment) {
      versions.unshift("latest");
    }
    return page({ versions, testname });
  },
});

export default define.page<typeof handler>(function MetaframePage(props) {
  return (
    <>
      <Head>
        <meta charset="UTF-8" />
        <title>Metapage test: {props.data.testname}</title>
        <meta name="description" content="List metapage versions" />
      </Head>
      <main>
        <h2>Metapage test: {props.data.testname}</h2>
        <br />
        <p>Choose version:</p>
        <br />
        <ul>
          {props.data.versions.map((version) => (
            <li>
              <a href={`./${props.data.testname}/${version}`}>{version}</a>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
});
