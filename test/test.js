const puppeteer = require('puppeteer');
const fs = require('fs');

const debug = false;
const isContainer = fs.existsSync('/.dockerenv');

const timeout = setTimeout(() => {
  console.log('FAIL: tests timed out!');
  process.exit(1);
}, 15000);

(async () => {
  const browser = await puppeteer.launch({
    args: [
      // Required for running in the test container
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ],
    executablePath: isContainer ? '/usr/bin/chromium-browser' : undefined,
    dumpio: debug
  });
    
  const page = await browser.newPage();

  if (debug) {
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
  const host = isContainer ? 'http://jekyll:4000' : 'http://localhost:4000'; 
  const url = `${host}/metapages/test/?MP_DEBUG`;

  await page.goto(url);
  // await page.screenshot({path: 'example.png'});
  await page.waitForFunction('document.querySelector("#status").innerText.indexOf("METAPAGE TESTS PASS") > -1',
  {
    polling: 200,
    timeout: 10000
  });

  clearTimeout(timeout);
  await browser.close();
  console.log('SUCCESS Test(s) pass!');
})();
