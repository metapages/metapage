import { page } from "fresh";
import { Head } from "fresh/runtime";
import { MetapageVersionsAll } from "@metapages/metapage";

import { define } from "../../../utils.ts";

export const handler = define.handlers({
  GET() {
    return page({ versions: MetapageVersionsAll.toReversed() });
  },
});

export default define.page<typeof handler>(
  function MetapageConversionPage(props) {
    return (
      <>
        <Head>
          <meta charset="UTF-8" />
          <title>Metapage definition conversion</title>
        </Head>
        <main>
          <h2>Metapage definition conversion</h2>
          <br />
          <p>Choose target metapage definition version:</p>
          <br />
          <ul>
            {props.data.versions.map((version) => (
              <li>
                <a href={`./metapage/v${version}`}>{version}</a>
              </li>
            ))}
          </ul>
        </main>
      </>
    );
  },
);
