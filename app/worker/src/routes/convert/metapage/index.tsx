import { Head } from '$fresh/runtime.ts';
import {
  type Handlers,
  PageProps,
} from '$fresh/server.ts';
import { MetapageVersionsAll } from "@lib/metapage/versions.ts";
import type { VersionsProps } from "../../test/_types.ts";

export const handler: Handlers = {
  async GET(_req, ctx) {
    return ctx.render({ versions: MetapageVersionsAll.toReversed() });
  },
};

export default function MetapageConversionPage(props: PageProps<VersionsProps>) {
  return (
    <>
      <Head>
        <meta charset="UTF-8" />
        <title>Metapage definition conversion</title>
      </Head>
      <main>
        <h2>Metapage definition conversion</h2>
        <br/>
        <p>Choose target metapage definition version:</p>
        <br/>
        <ul>
        {
          props.data.versions.map((version) => (
            <li><a href={`./metapage/v${version}`}>{version}</a></li>   
          ))
        }
        </ul>
      </main>
    </>
  );
}