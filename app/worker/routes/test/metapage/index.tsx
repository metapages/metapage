import { PageProps } from "$fresh/server.ts";
import {
  compare,
  parse
} from "@std/semver";
import { Head } from "$fresh/runtime.ts";

export default function MetaframePage(props: PageProps) {
  // let { version } = props.params;
  // // the URL param version=latest-begin is a way of having
  // // the same metaframe/plugin in multiple places without
  // // id/key collisions. The actual version of 'latest-begin'
  // // is 'latest' which we check below, but we want to display
  // // the version given
  // const displayVersion = version;

  // if (version.startsWith('latest')) {
  //     // it can be versionLatest in the URL header but the internal VERSION must then be 'latest';
  //     version = 'latest';
  // }

  return (
    <>
      <Head>
        <meta charset="UTF-8" />
        <title>Metapage tests</title>
        {/* <script type="module" src={metapageScriptSrc}></script> */}
      </Head>
    <main>
      <h1>Metapage tests:</h1>
      <br/>
      <ul>
        <li><a href={`./compatibility`}>Test all (non-deprecated) metaframe versions with this metapage version</a></li>
        <li><a href={`./timing`}>Test timing and internal APIs</a></li>
      </ul>
    </main>
    </>
  );
}