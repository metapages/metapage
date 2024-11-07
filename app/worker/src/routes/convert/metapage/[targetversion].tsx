import { Head } from '$fresh/runtime.ts';
import {
  type Handlers,
  PageProps,
} from '$fresh/server.ts';

import {
  convertMetapageDefinitionToVersion,
} from '../../../lib/metapage/conversions-metapage.ts';
import { VersionsMetapage } from '@lib/metapage/versions.ts';

import { type TargetVersionProps } from '../types.ts';

export const handler: Handlers = {
  async GET(_req, ctx) {
    const url = new URL(_req.url).href;
    return ctx.render({...ctx.data, url});
  },

  async POST(_req, ctx) {
    const url = new URL(_req.url);
    const targetVersion = url.pathname.split('/').pop()?.replace('v', '') || "1";
    let metapageDefinition: string | null = null;

    const contentType = _req.headers.get("content-type");
    console.log(contentType);
    if (contentType && contentType.includes("application/json")) {
      // Handle JSON data
      try {
        const jsonData = await _req.json();
        metapageDefinition = jsonData;
      } catch (error) {
        return new Response("Invalid JSON", { status: 400 });
      }
    } else {
      // Handle form data
      const form = await _req.formData();
      try {
        console.log('form.get("metapageDefinition")', form.get("metapageDefinition"));
        metapageDefinition = JSON.parse(form.get("metapageDefinition") as string | null || "");
      } catch (error) {
        return new Response("Invalid JSON", { status: 400 });
      }
      
    }

    if (!metapageDefinition) {
      return new Response("Missing metapage definition", { status: 400 });
    }

    console.log(`metapageDefinition (targetVersion=${targetVersion})`, metapageDefinition);

    try {
      const newVersion = await convertMetapageDefinitionToVersion(metapageDefinition, targetVersion as VersionsMetapage);
      return new Response(JSON.stringify(newVersion), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error :any) {
      console.error('Error converting metapage:', error);
      return new Response(`Error converting metapage: ${error?.message || error}`, { status: 400 });
    }
  },
};

export default function MetapageConversionPage(props: PageProps<TargetVersionProps & {url: string}>) {
  
  const mainStyle = {
    display: "flex",
    flexDirection: "column",
    height: "calc(100vh - 200px)",
    padding: "20px",
    maxWidth: "1200px",
    margin: "0 auto",
  };

  const headingStyle = {
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "16px",
  };

  const formStyle = {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
  };

  const textareaStyle = {
    width: "100%",
    flexGrow: 1,
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    minHeight: "200px",
    marginBottom: "16px",
    resize: "none",
  };

  const buttonStyle = {
    backgroundColor: "#3490dc",
    color: "white",
    fontWeight: "bold",
    padding: "8px 16px",
    margin: "8px 0px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
    maxWidth: "180px",
  };


  return (
    <>
      <Head>
        <meta charset="UTF-8" />
        <title>Metapage definition conversion</title>
      </Head>
       <main style={mainStyle}>
        <h2 style={headingStyle}>
          Convert metapage definition to version {props.params.targetversion}
        </h2>

        <div style="margin-bottom: 40px; margin-top: 20px; margin-left: 20px;">
          <p>This route is a public api. Example CURL request:</p>
          <br/>
          <div style="margin-left: 20px; background-color: #f0f0f0; padding: 10px; border-radius: 5px;">

          <code>curl -X POST -H "Content-Type: application/json" -d {'\'{"version":"0.3","metaframes":{"r":{"url":"https://metapages.org/metaframes/random-data-generator/?frequency=1000"},"g":{"url":"https://metapages.org/metaframes/graph-dynamic/","inputs":[{"metaframe":"r","source":"y"}]}}}\''} {props.data.url}</code>
          </div>
        </div>

        
        <form method="POST" style={formStyle}>
        <button
            type="submit"
            style={buttonStyle}
          >
            Convert to version {props.params.targetversion}
          </button>
          <textarea
            name="metapageDefinition"
            style={textareaStyle}
            placeholder="Paste your metapage definition here"
          ></textarea>
          <button
            type="submit"
            style={buttonStyle}
          >
            Convert to version {props.params.targetversion}
          </button>
        </form>
      </main>
    </>
  );
}