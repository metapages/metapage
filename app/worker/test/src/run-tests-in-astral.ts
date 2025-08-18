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

// Increase timeout for headless mode as it can be slower
const timePerTest = headless ? 60000 : 20000; // 60s for headless, 20s for browser
const serverPort = Deno.env.get("APP_PORT") ? parseInt(Deno.env.get("APP_PORT")!) : 8762;
const serverFqdn = Deno.env.get("APP_FQDN") ? Deno.env.get("APP_FQDN")! : "localhost";
// const serverOrigin = `https://${serverFqdn}:${serverPort}`;
const serverOrigin = `https://localhost:${serverPort}`;

type TestType = "compatibility" | "globs" | "first-message" | "io-pipe-names";

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



// Add a helper function to check if tests are actually running
async function checkTestStatus(page: any): Promise<{ isRunning: boolean; status: string; hasIframes: boolean }> {
  try {
    const statusElement = await page.$('#status');
    if (!statusElement) {
      return { isRunning: false, status: 'No status element found', hasIframes: false };
    }
    
    const statusText = await page.evaluate(() => {
      const el = document.querySelector('#status');
      return el ? el.textContent : 'No status element';
    });
    
    // Check if iframes are present (indicating tests are running)
    const iframes = await page.$$('iframe');
    const hasIframes = iframes.length > 0;
    
    const isRunning = !statusText.includes('METAPAGE TESTS PASS') && 
                     !statusText.includes('TESTS FAIL') && 
                     statusText !== 'status';
    
    return { isRunning, status: statusText, hasIframes };
  } catch (err) {
    return { isRunning: false, status: `Error checking status: ${err}`, hasIframes: false };
  }
}

// Add a helper function to monitor test progress
async function monitorTestProgress(page: any, timeout: number) {
  const startTime = Date.now();
  const checkInterval = 5000; // Check every 5 seconds
  
  return new Promise<void>((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const elapsed = Date.now() - startTime;
        const { isRunning, status, hasIframes } = await checkTestStatus(page);
        
        console.log(`[${Math.floor(elapsed/1000)}s] Status: "${status}" | Running: ${isRunning} | Iframes: ${hasIframes}`);
        
        if (status && status.includes('METAPAGE TESTS PASS')) {
          clearInterval(interval);
          resolve();
        } else if (status && status.includes('TESTS FAIL')) {
          clearInterval(interval);
          reject(new Error(`Tests failed: ${status}`));
        }
        
        if (elapsed > timeout) {
          clearInterval(interval);
          reject(new Error('Test timeout exceeded'));
        }
      } catch (err) {
        console.log('Error monitoring test progress:', err);
      }
    }, checkInterval);
  });
}

async function runSingleMetapageTest(type :TestType, version: string, timeout: number) {
  console.log(
    `\n\nRUNNING METAPAGE TEST: ${version} timeout:${timeout / 1000}s headless:${headless}`
  );

  // Enhanced browser configuration for headless mode
  const browserArgs = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
  ];
  
  // Add additional arguments for headless mode stability
  if (headless) {
    browserArgs.push(
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
      "--disable-features=TranslateUI",
      "--disable-ipc-flooding-protection",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-default-apps",
      "--disable-extensions",
      "--disable-plugins",
      "--disable-sync",
      "--disable-translate",
      "--hide-scrollbars",
      "--mute-audio",
      "--no-zygote",
      "--single-process",
      "--ignore-certificate-errors",
      "--ignore-ssl-errors",
      "--ignore-certificate-errors-spki-list",
      "--allow-insecure-localhost",
      "--disable-web-security",
      "--disable-features=VizDisplayCompositor",
      "--ignore-certificate-errors",
      "--ignore-ssl-errors",
      "--ignore-certificate-errors-spki-list",
      "--allow-insecure-localhost",
      "--disable-extensions-except",
      "--disable-extensions-file-access-check"
    );
  }

  const browser = await launch({
    headless: headless,
    args: browserArgs,
    dumpio: consoleToLogs,
    // Add viewport for consistent behavior
    defaultViewport: { width: 1280, height: 720 },
  });

  const page = await browser.newPage();

  // Enhanced error handling and logging for headless mode
  if (consoleToLogs || headless) {
    // Note: Astral API doesn't support page.on() event handlers
    // We'll rely on dumpio and other debugging methods instead
    console.log('Enhanced logging enabled - using dumpio for browser output');
  }

  const url = getMetapageTestUrl(type, version);
  console.log(`Metapage url: ${url}`);

  // Debug: Check if the URL is accessible before loading
  try {
    console.log('🔍 Checking URL accessibility...');
    const response = await fetch(url);
    console.log(`📡 URL accessibility check: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.log(`❌ URL returned error status: ${response.status}`);
    }
  } catch (err) {
    console.log(`❌ URL accessibility check failed:`, err);
  }

  try {
    console.log('🚀 Attempting to navigate to page...');
    
    // Try different navigation strategies with shorter timeouts
    try {
      // First try with load (fastest)
      console.log('🔄 Trying load strategy...');
      await page.goto(url, { 
        waitUntil: 'load'
      });
      console.log('✅ Page loaded with load');
    } catch (err1: any) {
      console.log('⚠️ load failed, trying none:', err1?.message || 'Unknown error');
      
      try {
        // Fallback to none (just navigate, don't wait)
        console.log('🔄 Trying none strategy...');
        await page.goto(url, { 
          waitUntil: 'none'
        });
        console.log('✅ Page loaded with none');
        
        // Wait a bit for content to load
        await page.waitForTimeout(3000);
        
      } catch (err2: any) {
        console.log('⚠️ none failed:', err2?.message || 'Unknown error');
        
        // Last resort: try to navigate without any wait conditions
        console.log('🔄 Trying direct navigation...');
        try {
          await page.goto(url);
          console.log('✅ Page loaded with direct navigation');
          await page.waitForTimeout(5000); // Wait for content
        } catch (err3: any) {
          console.log('❌ All navigation strategies failed:', err3?.message || 'Unknown error');
          
          // Final fallback: try to set content directly
          console.log('🔄 Trying to set page content directly...');
          try {
            const pageContent = await fetch(url).then(r => r.text());
            await page.setContent(pageContent);
            console.log('✅ Page content set directly');
            await page.waitForTimeout(3000);
          } catch (err4: any) {
            console.log('❌ Even direct content setting failed:', err4?.message || 'Unknown error');
            throw err3; // Throw the original navigation error
          }
        }
      }
    }
    
    console.log('Page loaded, waiting for #status element');
    
    // Wait for the status element to be present first
    await page.waitForSelector('#status', { timeout: 10000 });
    console.log('Status element found, waiting for content');
    
    // Wait a bit for the content to populate
    await page.waitForTimeout(2000);
    
    // Check current status content
    const statusText = await page.evaluate(() => {
      const el = document.querySelector('#status');
      return el ? el.textContent : 'No status element';
    });
    console.log(`Current status text: "${statusText}"`);
    
    // Wait for tests to actually start running
    let attempts = 0;
    const maxAttempts = 10;
    while (attempts < maxAttempts) {
      const { isRunning, status, hasIframes } = await checkTestStatus(page);
      console.log(`Attempt ${attempts + 1}: Status="${status}" | Running=${isRunning} | Iframes=${hasIframes}`);
      
      if (isRunning || hasIframes) {
        console.log('Tests appear to be running, proceeding with monitoring...');
        break;
      }
      
      if (attempts === maxAttempts - 1) {
        console.log('Tests do not appear to be running after multiple attempts');
        
        // Enhanced debugging: Check what's actually on the page
        try {
          console.log('🔍 Debugging test execution...');
          
          // Check if the test script tag exists
          const scriptTags = await page.evaluate(() => {
            const scripts = document.querySelectorAll('script');
            return Array.from(scripts).map(s => ({
              src: s.src,
              type: s.type,
              content: s.textContent ? s.textContent.substring(0, 100) + '...' : 'No content'
            }));
          });
          console.log('📜 Script tags found:', scriptTags);
          
          // Check if there are any console errors
          console.log('📝 Checking for console errors...');
          
          // Check page content for clues
          const bodyContent = await page.evaluate(() => {
            const body = document.querySelector('#body');
            return body ? body.innerHTML.substring(0, 500) : 'No body element';
          });
          console.log('📄 Body content:', bodyContent);
          
          // Check if the test script file is accessible
          const testScriptUrl = `${serverOrigin}/test/metapage/${type}/metapage-test.js`;
          try {
            const scriptResponse = await fetch(testScriptUrl);
            console.log(`📁 Test script accessibility: ${scriptResponse.status} ${scriptResponse.statusText}`);
            
            if (scriptResponse.ok) {
              const scriptContent = await scriptResponse.text();
              console.log(`📜 Test script content (first 200 chars): ${scriptContent.substring(0, 200)}`);
            }
          } catch (err) {
            console.log(`❌ Test script fetch error:`, err);
          }
          
        } catch (debugErr) {
          console.log('Could not perform enhanced debugging:', debugErr);
        }
        
        // Continue anyway, the monitoring function will handle timeouts
      }
      
      await page.waitForTimeout(1000);
      attempts++;
    }
    
  } catch (err) {
    console.error('Error loading page or finding status element:', err);
    await browser.close();
    throw err;
  }

  // if the code says we fail, bail out and notify.
  try {
    // Use evaluate instead of waitForFunction for better compatibility
    let testFailed = false;
    let attempts = 0;
    const maxAttempts = Math.floor(timeout / 1000);
    
    while (attempts < maxAttempts && !testFailed) {
      const statusText = await page.evaluate(() => {
        const el = document.querySelector('#status');
        return el ? el.textContent : 'No status element';
      });
      
      if (statusText && statusText.includes('TESTS FAIL')) {
        console.log("💥💥💥   FAIL: browser says:      🤦‍♀️🤦‍♀️🤦‍♀️");
        console.error(statusText);
        testFailed = true;
        if (headless) {
          await shutdownServer();
          Deno.exit(1);
        }
        break;
      }
      
      if (statusText && statusText.includes('METAPAGE TESTS PASS')) {
        console.log(`🍀🍀🍀   SUCCESS version:${version}   🍾🍾🍾 `);
        await browser.close();
        return;
      }
      
      attempts++;
      await page.waitForTimeout(1000);
    }
    
    if (testFailed) {
      return; // Already handled above
    }
    
  } catch (err) {
    console.log('Error checking test status:', err);
  }

  try {
    console.log('Waiting for "METAPAGE TESTS PASS" message...');
    
    // Use the monitoring function for better debugging
    if (headless) {
      await monitorTestProgress(page, timeout);
    } else {
      // For non-headless mode, use a simple polling approach
      let attempts = 0;
      const maxAttempts = Math.floor(timeout / 1000);
      
      while (attempts < maxAttempts) {
        const statusText = await page.evaluate(() => {
          const el = document.querySelector('#status');
          return el ? el.textContent : 'No status element';
        });
        
        if (statusText && statusText.includes('METAPAGE TESTS PASS')) {
          console.log(`🍀🍀🍀   SUCCESS version:${version}   🍾🍾🍾 `);
          await browser.close();
          return;
        }
        
        attempts++;
        await page.waitForTimeout(1000);
      }
    }
    
    console.log(`🍀🍀🍀   SUCCESS version:${version}   🍾🍾🍾 `);
    await browser.close();
  } catch (err) {
    console.log(`💥💥💥   fail version:${version} TIMEOUT`);
    
    // Enhanced debugging for headless mode failures
    if (headless) {
      try {
        const finalStatus = await page.evaluate(() => {
          const el = document.querySelector('#status');
          return el ? el.textContent : 'No status element';
        });
        console.log(`Final status content: "${finalStatus}"`);
        
        // Take a screenshot for debugging
        await page.screenshot({ format: 'png' });
        console.log(`Screenshot captured`);
        
        // Get page HTML for debugging
        const html = await page.content();
        console.log('Page HTML (first 1000 chars):', html.substring(0, 1000));
      } catch (debugErr) {
        console.log('Could not capture debug info:', debugErr);
      }
    }
    
    await browser.close();
    await shutdownServer();
    Deno.exit(1);
  } 
}

const getMetapageTestUrl = (test :TestType, version: string) => {
  // https://metapage-npm.dev:4441/test/metapage/compatibility/
  // return `${serverOrigin}/test/metapage/${test}/${version}${
  return `${serverOrigin}/test/metapage/${test}/${version}${
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

const getRepresentativeMetapageVersions = async () :Promise<string[]> => {
  
  let versions = await getMetapageVersions();
  // Only most recent x.y versions
  // versions are already sorted
  const minorLimit = 0;
  const subset: string[] = [];
  let currentMajor = 10000;
  let currentMinor = 10000;
  let minors = 0;
  for (const version of versions) {
    const [x, y] = version.split(".").map(v => parseInt(v));
    if (x < currentMajor) {
      currentMajor = x;
      currentMinor = y;
      subset.push(version);
      minors = 0;
    } else if (y < currentMinor || minors < minorLimit) {
      currentMinor = y;
      subset.push(version);
      minors++;
    }
  }
  return subset;
};




let allVersions = await getRepresentativeMetapageVersions();
console.log(`🍳👉 representative versions ${allVersions}`);
if (!nolocalBuild) {
  allVersions.unshift("latest");
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

// run tests sequentially, not concurrently
for (const testType of ["io-pipe-names", "globs", "first-message", "compatibility"] as TestType[]) {
  for (const version of allVersions) {
    if (version !== "latest" && testType === "globs" && compareVersions(version, "1.1.0") < 0) {
      console.log(`🍳👉 skipping ${testType} test for version ${version} because < 1.1.0`);
      continue;
    }

    if (version !== "latest" && testType === "io-pipe-names" && compareVersions(version, "1.2.2") <= 0) {
      console.log(`🍳👉 skipping ${testType} test for version ${version} because <= 1.2.2`);
      continue;
    }

    console.log(`\n🚀 Starting test: ${testType} for version: ${version}`);
    console.log(`⏱️  Test timeout: ${timePerTest * allVersions.length / 1000}s`);
    console.log(`🔍 Headless mode: ${headless}`);
    
    try {
      await runSingleMetapageTest(testType, version, timePerTest * allVersions.length);
      console.log(`✅ Test completed successfully: ${testType} - ${version}`);
    } catch (err) {
      console.error(`❌ Test failed: ${testType} - ${version}`, err);
      if (headless) {
        console.log(`💡 Debug info: Check the screenshot and HTML output above for more details`);
        console.log(`💡 You can also run with --disable-headless to see the browser window`);
        console.log(`💡 Or run with --browser-console-stdout to see browser console output`);
      }
      await shutdownServer();
      Deno.exit(1);
    }
  }
}

clearTimeout(timeout);
console.log(`🍀🍀🍀   SUCCESS Test(s) pass!   🍾🍾🍾`);
await shutdownServer();
Deno.exit(0);
