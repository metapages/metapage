/**
 * CLI flags:
 *   --debug-metapage             Turn on metapage+metaframe debugging (debug=1 in the URL query params), very verbose. For metapage/metaframe internal issues
 *   --browser-console-stdout     Pipe the browser console output to stdout (for iterative debugging)
 *   --no-local-build             Disable checks on the locally built libs (useful for debugging), so only already published (and hopefully already tested) versions
 *   --disable-headless           Show the actual browser window (rather than headless), for easier debugging
 *
 * Run the full set of tests:
 *   1. Get all versions to test (metapage and metaframe packaged together)
 *   2. For each metapage version
 *       - test all metaframes
 *   3. exit 0 (success)
 *
 */

import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";
import { exists } from "https://deno.land/std/fs/mod.ts";
import { parse } from "https://deno.land/std/flags/mod.ts";

const flags = parse(Deno.args);

const debugMetapage = flags["debug-metapage"] || false;
const consoleToLogs = flags["browser-console-stdout"] || false;
const nolocalBuild = flags["no-local-build"] || false;
const headless = !flags["disable-headless"];

const isContainer = await exists("/.dockerenv");
const timePerTest = 10000;
const serverPort = Deno.env.get("APP_PORT") ? parseInt(Deno.env.get("APP_PORT")!) : 4430;
const serverFqdn = Deno.env.get("APP_FQDN") ? Deno.env.get("APP_FQDN")! : "server1.localhost";
const serverOrigin = `https://${serverFqdn}:${serverPort}`

async function runSingleMetapageTest(version: string, timeout: number) {
  console.log(
    `\n\nRUNNING METAPAGE TEST: ${version} timeout:${timeout / 1000}s`
  );
  const browser = await puppeteer.launch({
    headless: headless,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
    dumpio: consoleToLogs,
  });

  const page = await browser.newPage();

  if (consoleToLogs) {
    page.on("pageerror", function (err) {
      console.log("Page error: ", err);
    });
    page.on("error", (err) => {
      console.log("error happen at the page: ", err);
    });
    page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
    page.on("response", (response) => {
      console.log(response.status(), response.url());
    });
    page.on("requestfailed", (request) => {
      console.log(request.failure()?.errorText, request.url());
    });
  }

  const url = getMetapageTestUrl(version);
  console.log(`Metapage url: ${url}`);

  await page.goto(url);
  console.log('WAITING FOR document.querySelector("#status")');

  // if the code says we fail, bail out and notify.
  try {
    await page.waitForFunction(
      'document.querySelector("#status").innerText.indexOf("TESTS FAIL") > -1',
      {
        polling: 200,
        timeout: timeout,
      }
    );
    const thing = await page.waitForFunction(
      'document.querySelector("#status").innerText'
    );
    console.log("💥💥💥   FAIL: browser says:      🤦‍♀️🤦‍♀️🤦‍♀️");
    const val = await thing.jsonValue();
    console.error(val);
    if (headless) {
      Deno.exit(1);
    }
  } catch (err) {
    // ignored
  }

  await page.waitForFunction(
    'document.querySelector("#status").innerText.indexOf("METAPAGE TESTS PASS") > -1',
    {
      polling: 200,
      timeout: timeout,
    }
  );

  await browser.close();
  console.log(`🍀🍀🍀   SUCCESS version:${version}   🍾🍾🍾 `);
}

const getMetapageTestUrl = (version: string) => {
  // https://metapage-npm.dev:4441/test/metapage/compatibility/
  return `${serverOrigin}/test/metapage/compatibility/${version}${
    debugMetapage ? "?debug=true" : ""
  }`;
};

const getMetapageVersions = async () :Promise<string[]> => {
  const resp = await fetch(`${serverOrigin}/versions/metapages/metapage`);
  const versions = await resp.json();
  return versions;
};



// Assuming lib.ts is a local module with Deno-compatible functions
// import * as lib from "./lib.ts";

(async () => {
  // const server = await lib.createServer(serverPort);
  // await lib.generate();
  console.log("🍳👉 generated page from templates with all metaframe versions");

  let allVersions = await getMetapageVersions();
  if (!nolocalBuild) {
    allVersions.push("latest");
  }
  console.log(`🍳👉 allVersions ${allVersions}`);
  const maxTimeAllTests = timePerTest * allVersions.length ** 2;
  console.log(`Timeout: ${maxTimeAllTests / 1000}s`);
  const timeout = setTimeout(() => {
    console.log("💥💥💥   FAIL: tests timed out!   🤦‍♀️🤦‍♀️🤦‍♀️");
    if (headless) {
      Deno.exit(1);
    }
  }, maxTimeAllTests);

  console.log(
    `  ${allVersions
      .map(getMetapageTestUrl)
      .map((e) => e.replace("docs", "localhost"))
      .join("\n  ")}`
  );

  // run tests sequentially, not concurrently
  for (const version of allVersions) {
    await runSingleMetapageTest(version, timePerTest * allVersions.length);
  }

  clearTimeout(timeout);
  console.log(`🍀🍀🍀   SUCCESS Test(s) pass!   🍾🍾🍾`);
  Deno.exit(0);
})();