import { page } from "fresh";
import { Head } from "fresh/runtime";
import { MetaframeVersionsAll } from "@metapages/metapage";

import { define } from "../../../utils.ts";

export const handler = define.handlers({
  GET() {
    return page({ versions: MetaframeVersionsAll.toReversed() });
  },
});

export default define.page<typeof handler>(
  function MetaframeConversionPage(props) {
    return (
      <>
        <Head>
          <meta charset="UTF-8" />
          <title>Metaframe definition conversion</title>
        </Head>
        <main>
          <h2>Metaframe definition conversion</h2>
          <br />
          <p>Choose target metaframe definition version:</p>
          <br />
          <ul>
            {props.data.versions.map((version) => (
              <li>
                <a href={`./metaframe/v${version}`}>{version}</a>
              </li>
            ))}
          </ul>
        </main>
      </>
    );
  },
);
