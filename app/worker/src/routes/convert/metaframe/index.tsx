import { Head } from '$fresh/runtime.ts';
import {
  type Handlers,
  PageProps,
} from '$fresh/server.ts';
import { MetaframeVersionsAll } from "@lib/metapage/versions.ts";
import type { VersionsProps } from "../../test/_types.ts";

export const handler: Handlers = {
  async GET(_req, ctx) {
    return ctx.render({ versions: MetaframeVersionsAll.toReversed() });
  },
};

export default function MetaframeConversionPage(props: PageProps<VersionsProps>) {
  return (
    <>
      <Head>
        <meta charset="UTF-8" />
        <title>Metaframe definition conversion</title>
      </Head>
      <main>
        <h2>Metaframe definition conversion</h2>
        <br/>
        <p>Choose target metaframe definition version:</p>
        <br/>
        <ul>
        {
          props.data.versions.map((version) => (
            <li><a href={`./metaframe/v${version}`}>{version}</a></li>   
          ))
        }
        </ul>
      </main>
    </>
  );
}