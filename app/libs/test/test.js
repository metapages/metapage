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
const debugMetapage = process.argv.reduce((prev, curr) => { return prev ? prev : curr === '--debug-metapage' }, false);
const consoleToLogs = process.argv.reduce((prev, curr) => { return prev ? prev : curr === '--browser-console-stdout' }, false);
const nolocalBuild = process.argv.reduce((prev, curr) => { return prev ? prev : curr === '--no-local-build' }, false);
const headless = !(process.argv.reduce((prev, curr) => { return prev ? prev : curr === '--disable-headless' }, false));

const fs = require('fs');
const puppeteer = require('puppeteer');
const lib = require('./lib');

const isContainer = fs.existsSync('/.dockerenv');
const timePerTest = 5000;
const serverPort = process.env.PORT ? parseInt(process.env.PORT) : 3000;

async function runSingleMetapageTest(version, timeout) {
  console.log(`\n\nRUNNING METPAGE TEST: ${version} timeout:${timeout / 1000}s`);
  const browser = await puppeteer.launch({
    headless: headless,
    bindAddress: "0.0.0.0",
    args: [
      // "--headless",
      // Required for running in the test container
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ],
    // executablePath: isContainer ? '/usr/bin/chromium-browser' : undefined,
    dumpio: consoleToLogs
  });

  const page = await browser.newPage();

  if (consoleToLogs) {
    page.on("pageerror", function (err) {
      console.log("Page error: ", err);
    });
    page.on('error', err => {
      console.log('error happen at the page: ', err);
    });
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('response', response => {
      console.log(response.status, response.url);
    });
    page.on('requestfailed', request => {
      console.log(request.failure().errorText, request.url);
    });
  }

  const url = getMetapageTestUrl(version);
  console.log(`Metapage url: ${url}`);

  await page.goto(url);
  console.log('WAITING FOR document.querySelector("#status")')

  // if the code says we fail, bail out and notify.
  page.waitForFunction('document.querySelector("#status").innerText.indexOf("TESTS FAIL") > -1',
    {
      polling: 200,
      timeout: timeout,
    }).then(async () => {
      const thing = await page.waitForFunction('document.querySelector("#status").innerText');
      console.log('💥💥💥   FAIL: browser says:      🤦‍♀️🤦‍♀️🤦‍♀️');
      const val = await thing.jsonValue();
      console.error(val);
      if (headless) {
        process.exit(1);
      }
    }).catch((err) => {
      // ignored
    });

  await page.waitForFunction('document.querySelector("#status").innerText.indexOf("METAPAGE TESTS PASS") > -1',
    {
      polling: 200,
      timeout: timeout,
    });
  console.log('check ok')

  await browser.close();
  console.log(`🍀🍀🍀   SUCCESS version:${version}   🍾🍾🍾 `);
}

const getMetapageTestUrl = (version) => {
  return `http://localhost:${serverPort}/?VERSION=${version}${debugMetapage ? "&MP_DEBUG" : ""}`;
}

(async () => {

  const server = await lib.createServer(serverPort);
  await lib.generate();
  console.log('🍳👉 generated page from templates with all metaframe versions')

  let allVersions = await lib.getMetapageVersions({includeLocal:false});
  if (!nolocalBuild) {
    allVersions.push('latest');
  }
  console.log(`🍳👉 allVersions ${allVersions}`)
  const maxTimeAllTests = timePerTest * allVersions.length ** 2;
  console.log(`Timeout: ${maxTimeAllTests / 1000}s`);
  const timeout = setTimeout(() => {
    console.log('💥💥💥   FAIL: tests timed out!   🤦‍♀️🤦‍♀️🤦‍♀️');
    if (headless) {
      process.exit(1);
    }
  }, maxTimeAllTests);

  console.log(`  ${allVersions.map(getMetapageTestUrl).map(e => e.replace('docs', 'localhost')).join("\n  ")}`);

  // run tests sequentially, not concurrently
  await (async () => {
    for (let job of allVersions.map(v => () => runSingleMetapageTest(v, timePerTest * allVersions.length)))
      await job()
  })();

  clearTimeout(timeout);
  console.log(`🍀🍀🍀   SUCCESS Test(s) pass!   🍾🍾🍾`);
  process.exit(0);
})();
