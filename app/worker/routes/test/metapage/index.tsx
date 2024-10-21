
import { PageProps, type Handlers } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { getAllMetapageVersions } from "../../_util/versions.ts";

interface MetapageVersionsProps {
  versions: string[];
}

export const handler: Handlers<MetapageVersionsProps> = {
  async GET(_req, ctx) {
    const versions = await getAllMetapageVersions();
    versions.unshift('latest');
    if (!versions) {
      return ctx.renderNotFound({
        versions: [],
      });
    }
    return ctx.render({ versions });
  },
};

export default function MetaframePage(props: PageProps<MetapageVersionsProps>) {
  console.log("props", props);

  return (
    <>
      <Head>
        <meta charset="UTF-8" />
        <title>Metapage published versions</title>
        <meta
          name="description"
          content="List metapage versions"
        />
      </Head>
      <main>
        <h2>Metapage published versions</h2>
        {
          props.data.versions.map((version) => (
            <>
              <a href={`/test/metapage/${version}`}>{version}</a>
              <br />
            </>
          ))
        }
      </main>
    </>
  );
}


