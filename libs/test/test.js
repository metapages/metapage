const fs = require('fs');
const puppeteer = require('puppeteer');
const versions = require('./versions');

const debugMetapage = false;
const consoleToLogs = false;
const isContainer = fs.existsSync('/.dockerenv');
const timePerTest = 5000

const getMetapageTestUrl = (version) => {
  const host = isContainer ? 'http://jekyll:4000' : 'http://localhost:4000'; 
  return `${host}/tests/?VERSION=${version}${debugMetapage ? "&MP_DEBUG" : ""}`;
}

async function runSingleMetapageTest(version, timeout) {
  console.log(`\n\nRUNNING TEST: ${version} timeout:${timeout / 1000}s`);
  const browser = await puppeteer.launch({
    args: [
      // Required for running in the test container
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ],
    executablePath: isContainer ? '/usr/bin/chromium-browser' : undefined,
    dumpio: consoleToLogs
  });
    
  const page = await browser.newPage();

  if (consoleToLogs) {
    page.on("pageerror", function(err) {  
      console.log("Page error: ", err); 
    });
    page.on('error', err=> {
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
  await page.waitForFunction('document.querySelector("#status").innerText.indexOf("METAPAGE TESTS PASS") > -1',
    {
      polling: 200,
      timeout: timeout,
    });

  await browser.close();
  console.log(`☘☘☘☘☘☘☘☘☘☘☘   SUCCESS version:${version}   ☘☘☘☘☘☘☘☘☘☘☘ `); 
}

(async () => {
  

  let allVersions = await versions.getMetapageVersions();
  allVersions.push('latest');

  const maxTimeAllTests = timePerTest * allVersions.length ** 2;
  console.log(`Timeout: ${maxTimeAllTests / 1000}s`);
  const timeout = setTimeout(() => {
    console.log('☢☢☢☢☢☢☢☢☢☢   FAIL: tests timed out!   ☢☢☢☢☢☢☢☢☢☢');
    process.exit(1);
  }, maxTimeAllTests);

  console.log(`  ${allVersions.map(getMetapageTestUrl).map(e => e.replace('jekyll', 'localhost')).join("\n  ")}`);

  // run tests sequentially, not concurrently
  await (async () => {
      for (let job of allVersions.map(v => () => runSingleMetapageTest(v, timePerTest * allVersions.length)))
          await job()
  })();

  clearTimeout(timeout);
  console.log(`🍀🍀🍀🍀🍀🍀🍀🍀🍀🍀   SUCCESS Test(s) pass!   🍀🍀🍀🍀🍀🍀🍀🍀🍀🍀`);
})();
