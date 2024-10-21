import { Head } from '$fresh/runtime.ts';
import {
  type Handlers,
  PageProps,
} from '$fresh/server.ts';

import { getAllMetapageVersions } from '../../../_util/versions.ts';
import type { VersionsProps } from '../../_types.ts';

export const handler: Handlers<VersionsProps> = {
  async GET(_req, ctx) {
    const versions = await getAllMetapageVersions();
    versions.unshift('latest');
    if (!versions) {
      return ctx.renderNotFound({
        versions: [],
        testname: ctx.params.testname,
      });
    }
    return ctx.render({ versions, testname: ctx.params.testname, });
  },
};

export default function MetaframePage(props: PageProps<VersionsProps>) {
  console.log('props', props.data);
  return (
    <>
      <Head>
        <meta charset="UTF-8" />
        <title>Metapage test: {props.data.testname}</title>
        <meta
          name="description"
          content="List metapage versions"
        />
      </Head>
      <main>
        <h2>Metapage test: {props.data.testname}</h2>
        <p>Choose version:</p>
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


