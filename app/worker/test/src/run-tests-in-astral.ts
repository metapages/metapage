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

import { compareVersions } from 'compare-versions';
import { parse } from 'https://deno.land/std/flags/mod.ts';
import { launch } from 'jsr:@astral/astral';

const flags = parse(Deno.args);

const debugMetapage = flags["debug-metapage"] || false;
const consoleToLogs = flags["browser-console-stdout"] || false;
const nolocalBuild = flags["no-local-build"] || false;
const headless = !flags["disable-headless"];

const timePerTest = 10000;
const serverPort = Deno.env.get("APP_PORT") ? parseInt(Deno.env.get("APP_PORT")!) : 4430;
const serverFqdn = "localhost";//Deno.env.get("APP_FQDN") ? Deno.env.get("APP_FQDN")! : "server1.localhost";
const serverOrigin = `http://${serverFqdn}:${serverPort}`;

// Function to start the Deno Fresh server
async function startDenoFreshServer() {
  console.log("Starting Deno Fresh server ", Deno.cwd());
  const command = new Deno.Command("deno", {
    args: ["task", "start"],
    stdout: "piped",
    stderr: "piped",
  });

  const process = command.spawn();

  // Wait for the server to start
  const decoder = new TextDecoder();
  (async () => {

    for await (const chunk of process.stdout) {
      const output = decoder.decode(chunk);
      console.log(output);
      if (output.includes("Listening on")) {
        console.log("Deno Fresh server started");
        break;
      }
    }
  })();

  return process;
}

const serverProcess = await startDenoFreshServer();

const shutdownServer = async () => {
  // Shutdown the Deno Fresh server
  serverProcess.kill("SIGTERM");
  await serverProcess.status;
  console.log("Deno Fresh server stopped");
}

async function pollServerUntilUp(url: string, maxAttempts = 30, interval = 1000) {
  console.log(`Polling server until up: ${url}`);
  const isUp = async () => {
    try {
      const response = await fetch(url);
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  for await (const attempt of Array.from(Array(maxAttempts).keys())) {
    const up = await isUp();
    if (up) {
      console.log('Server is up!');
      return true;
    }
    console.log(`Attempt ${attempt + 1} failed. Retrying in ${interval}ms...`);
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  console.error('Server did not come up within the allocated time');
  return false;
}

// ensure the server is fully ready
await pollServerUntilUp(serverOrigin);

async function runSingleMetapageTest(version: string, timeout: number) {
  console.log(
    `\n\nRUNNING METAPAGE TEST: ${version} timeout:${timeout / 1000}s`
  );

  

  const browser = await launch({
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
      await shutdownServer();
      Deno.exit(1);
    }
  } catch (err) {
    // ignored
  }

  try {
    await page.waitForFunction(
      'document.querySelector("#status").innerText.indexOf("METAPAGE TESTS PASS") > -1',
      {
        polling: 200,
        timeout: timeout,
      }
    );
    console.log(`🍀🍀🍀   SUCCESS version:${version}   🍾🍾🍾 `);
    await browser.close();
  } catch (err) {
    console.log(`💥💥💥   fail version:${version} TIMEOUT`);
    await browser.close();
    await shutdownServer();
    Deno.exit(1);
  } 
}

const getMetapageTestUrl = (version: string) => {
  // https://metapage-npm.dev:4441/test/metapage/compatibility/
  return `${serverOrigin}/test/metapage/compatibility/${version}${
    debugMetapage ? "?debug=true" : ""
  }`;
};

const getMetapageVersions = async () :Promise<string[]> => {
  const resp = await fetch(`${serverOrigin}/versions/metapages/metapage`);
  let versions = await resp.json();
  // remove versions we know don't pass
  versions = versions.filter((v: string) => compareVersions(v, "0.16.2") > 0);
  return versions;
};




let allVersions = await getMetapageVersions();
if (!nolocalBuild) {
  allVersions.push("latest");
}
console.log(`🍳👉 allVersions ${allVersions}`);
const maxTimeAllTests = timePerTest * allVersions.length ** 2;
console.log(`Timeout: ${maxTimeAllTests / 1000}s`);
const timeout = setTimeout(async () => {
  console.log("💥💥💥   FAIL: tests timed out!   🤦‍♀️🤦‍♀️🤦‍♀️");
  if (headless) {
    await shutdownServer();
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
await shutdownServer();
Deno.exit(0);
