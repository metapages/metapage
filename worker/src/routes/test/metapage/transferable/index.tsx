import { Head } from '$fresh/runtime.ts';
import {
  type Handlers,
  PageProps,
} from '$fresh/server.ts';

import { getAllMetapageVersions } from '../../../../util/version-tools.ts';
import type { VersionsProps } from '../../_types.ts';

export const handler: Handlers<VersionsProps> = {
  async GET(_req, ctx) {
    const urlPathElements = new URL(_req.url).pathname.split('/').filter(e => e !== '');
    var testname = urlPathElements[2];
    const versions = await getAllMetapageVersions();
    const isDevelopment = !Deno.env.get("DENO_DEPLOYMENT_ID");
    if (isDevelopment) {
      versions.unshift('latest');
    }
    if (!versions) {
      return ctx.renderNotFound({
        versions: [],
        testname,
      });
    }
    return ctx.render({ versions, testname, });
  },
};

export default function MetaframePage(props: PageProps<VersionsProps>) {

  return (
    <>
      <Head>
        <meta charset="UTF-8" />
        <title>Metapage test: {props.data.testname}</title>
        <meta
          name="description"
          content="Transferable objects binary data routing test"
        />
      </Head>
      <main>
        <h2>Metapage test: {props.data.testname}</h2>
        <br/>
        <p>Tests that binary data (ArrayBuffer, TypedArray, Blob, File) routes
        correctly without base64 serialization when isTransferableObjects is enabled.</p>
        <br/>
        <p>Choose version:</p>
        <br/>
        <ul>
        {
          props.data.versions.map((version) => (
            <li><a href={`./${props.data.testname}/${version}`}>{version}</a></li>
          ))
        }
        </ul>
      </main>
    </>
  );
}
