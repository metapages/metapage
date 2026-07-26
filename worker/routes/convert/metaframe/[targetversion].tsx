import { page } from "fresh";
import { Head } from "fresh/runtime";
import {
  convertMetaframeDefinitionToVersion,
  type VersionsMetaframe,
} from "@metapages/metapage";

import { define } from "../../../utils.ts";

export const handler = define.handlers({
  GET(ctx) {
    return page({ url: ctx.url.href });
  },

  async POST(ctx) {
    const url = ctx.url;
    const targetVersion = url.pathname.split("/").pop()?.replace("v", "") ||
      "1";
    let metaframeDefinition: string | null = null;

    const contentType = ctx.req.headers.get("content-type");
    console.log(contentType);
    if (contentType && contentType.includes("application/json")) {
      // Handle JSON data
      try {
        const jsonData = await ctx.req.json();
        metaframeDefinition = jsonData;
      } catch {
        return new Response("Invalid JSON", { status: 400 });
      }
    } else {
      // Handle form data
      const form = await ctx.req.formData();
      try {
        console.log(
          'form.get("metaframeDefinition")',
          form.get("metaframeDefinition"),
        );

        metaframeDefinition = JSON.parse(
          form.get("metaframeDefinition") as string | null || "",
        );
      } catch {
        return new Response("Invalid JSON", { status: 400 });
      }
    }

    if (!metaframeDefinition) {
      return new Response("Missing metaframe definition", { status: 400 });
    }

    console.log(
      `metaframeDefinition (targetVersion=${targetVersion})`,
      metaframeDefinition,
    );

    try {
      const newVersion = await convertMetaframeDefinitionToVersion(
        metaframeDefinition,
        targetVersion as VersionsMetaframe,
      );
      return new Response(JSON.stringify(newVersion), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      console.error("Error converting metaframe:", error);
      return new Response(
        `Error converting metaframe: ${error?.message || error}`,
        { status: 400 },
      );
    }
  },
});

export default define.page<typeof handler>(
  function MetaframeConversionPage(props) {
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
          <title>Metaframe definition conversion</title>
        </Head>
        <main style={mainStyle}>
          <h2 style={headingStyle}>
            Convert metaframe definition to version {props.params.targetversion}
          </h2>

          <div style="margin-bottom: 40px; margin-top: 20px; margin-left: 20px;">
            <p>This route is a public api. Example CURL request:</p>
            <br />
            <div style="margin-left: 20px; background-color: #f0f0f0; padding: 10px; border-radius: 5px;">
              <code>
                curl -X POST -H "Content-Type: application/json" -d{" "}
                {'\'{"version":"0.5","metadata":{"name":"Example animated input graph","author":"Dion Whitehead"},"inputs":{"x":{"type":"number"},"y":{"type":"number"}}}\''}
                {" "}
                {props.data.url}
              </code>
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
              name="metaframeDefinition"
              style={textareaStyle}
              placeholder="Paste your metaframe definition here"
            >
            </textarea>
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
  },
);
