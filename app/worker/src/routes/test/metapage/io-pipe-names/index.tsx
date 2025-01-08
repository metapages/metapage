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
    versions.unshift('latest');
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
      </Head>
      <main>
        <h2>Metapage test: {props.data.testname}</h2>
        <br/>
        <a href="https://app.metapage.io/dion/metapages-module-test-io-pipe-names-6a97801b3eed4b3d9d6f5d24b508f324?view=default">Source metapage</a>
        <br/>
        <br/>
        <p>Choose version:</p>
        <br/>
        {
          props.data.versions.map((version) => (
            <>
              <a href={`./${props.data.testname}/${version}`}>{version}</a>
              <br />
            </>
          ))
        }
      </main>
    </>
  );
}


