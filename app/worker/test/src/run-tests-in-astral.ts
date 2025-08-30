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

import { compareVersions } from "compare-versions";
import { parse } from "https://deno.land/std/flags/mod.ts";
import { launch } from "jsr:@astral/astral";

const flags = parse(Deno.args);

const debugMetapage = flags["debug-metapage"] || false;
const consoleToLogs = flags["browser-console-stdout"] || false;
const nolocalBuild = flags["no-local-build"] || false;
const headless = !flags["disable-headless"];

// Increase timeout for headless mode as it can be slower
const timePerTest = headless ? 60000 : 20000; // 60s for headless, 20s for browser
const serverPort = Deno.env.get("APP_PORT")
  ? parseInt(Deno.env.get("APP_PORT")!)
  : 8762;
const serverFqdn = Deno.env.get("APP_FQDN")
  ? Deno.env.get("APP_FQDN")!
  : "localhost";
const serverOrigin = `https://${serverFqdn}:${serverPort}`;

console.log(`🔧 Test configuration:`);
console.log(`   Server FQDN: ${serverFqdn}`);
console.log(`   Server Port: ${serverPort}`);
console.log(`   Server URL: ${serverOrigin}`);
console.log(`   Current working directory: ${Deno.cwd()}`);

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
};

async function pollServerUntilUp(
  url: string,
  maxAttempts = 30,
  interval = 1000
) {
  console.log(`Polling server until up: ${url}`);
  const isUp = async () => {
    try {
      const response = await fetch(url);
      console.log(
        `✅ Server responded with status: ${response.status} ${response.statusText}`
      );
      return response.ok;
    } catch (error) {
      console.log(
        `❌ Server connection failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return false;
    }
  };

  for await (const attempt of Array.from(Array(maxAttempts).keys())) {
    const up = await isUp();
    if (up) {
      console.log("🎉 Server is up and responding!");
      return true;
    }
    console.log(`Attempt ${attempt + 1} failed. Retrying in ${interval}ms...`);
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  console.error("💥 Server did not come up within the allocated time");
  console.error(`💡 Debug info: Check if the server is running on ${url}`);
  console.error(`💡 Check if the hostname ${serverFqdn} is in /etc/hosts`);
  console.error(`💡 Check if the server is bound to the correct interface`);
  return false;
}

// ensure the server is fully ready
await pollServerUntilUp(serverOrigin);

// Add a helper function to check if tests are actually running
async function checkTestStatus(
  page: any
): Promise<{ isRunning: boolean; status: string; hasIframes: boolean }> {
  try {
    const statusElement = await page.$("#status");
    if (!statusElement) {
      return {
        isRunning: false,
        status: "No status element found",
        hasIframes: false,
      };
    }

    const statusText = await page.evaluate(() => {
      const el = document.querySelector("#status");
      return el ? el.textContent : "No status element";
    });

    // Check if iframes are present (indicating tests are running)
    const iframes = await page.$$("iframe");
    const hasIframes = iframes.length > 0;

    const isRunning =
      !statusText.includes("METAPAGE TESTS PASS") &&
      !statusText.includes("TESTS FAIL") &&
      statusText !== "status";

    return { isRunning, status: statusText, hasIframes };
  } catch (err) {
    return {
      isRunning: false,
      status: `Error checking status: ${err}`,
      hasIframes: false,
    };
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

        console.log(
          `[${Math.floor(
            elapsed / 1000
          )}s] Status: "${status}" | Running: ${isRunning} | Iframes: ${hasIframes}`
        );

        if (status && status.includes("METAPAGE TESTS PASS")) {
          clearInterval(interval);
          resolve();
        } else if (status && status.includes("TESTS FAIL")) {
          clearInterval(interval);
          reject(new Error(`Tests failed: ${status}`));
        }

        if (elapsed > timeout) {
          clearInterval(interval);
          reject(new Error("Test timeout exceeded"));
        }
      } catch (err) {
        console.log("Error monitoring test progress:", err);
      }
    }, checkInterval);
  });
}

async function runSingleMetapageTest(
  type: TestType,
  version: string,
  timeout: number
) {
  console.log(
    `\n\nRUNNING METAPAGE TEST: ${version} timeout:${
      timeout / 1000
    }s headless:${headless}`
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
    console.log("Enhanced logging enabled - using dumpio for browser output");
  }

  const url = getMetapageTestUrl(type, version);
  console.log(`Metapage url: ${url}`);

  // Debug: Check if the URL is accessible before loading
  try {
    console.log("🔍 Checking URL accessibility...");
    const response = await fetch(url);
    console.log(
      `📡 URL accessibility check: ${response.status} ${response.statusText}`
    );

    if (!response.ok) {
      console.log(`❌ URL returned error status: ${response.status}`);
    }
  } catch (err) {
    console.log(`❌ URL accessibility check failed:`, err);
  }

  try {
    console.log("🚀 Attempting to navigate to page...");

    // Try different navigation strategies with shorter timeouts
    try {
      // First try with load (fastest)
      console.log("🔄 Trying load strategy...");
      await page.goto(url, {
        waitUntil: "load",
      });
      console.log("✅ Page loaded with load");
    } catch (err1: any) {
      console.log(
        "⚠️ load failed, trying none:",
        err1?.message || "Unknown error"
      );

      try {
        // Fallback to none (just navigate, don't wait)
        console.log("🔄 Trying none strategy...");
        await page.goto(url, {
          waitUntil: "none",
        });
        console.log("✅ Page loaded with none");

        // Wait a bit for content to load
        await page.waitForTimeout(3000);
      } catch (err2: any) {
        console.log("⚠️ none failed:", err2?.message || "Unknown error");

        // Last resort: try to navigate without any wait conditions
        console.log("🔄 Trying direct navigation...");
        try {
          await page.goto(url);
          console.log("✅ Page loaded with direct navigation");
          await page.waitForTimeout(5000); // Wait for content
        } catch (err3: any) {
          console.log(
            "❌ All navigation strategies failed:",
            err3?.message || "Unknown error"
          );

          // Final fallback: try to set content directly
          console.log("🔄 Trying to set page content directly...");
          try {
            const pageContent = await fetch(url).then((r) => r.text());
            await page.setContent(pageContent);
            console.log("✅ Page content set directly");
            await page.waitForTimeout(3000);
          } catch (err4: any) {
            console.log(
              "❌ Even direct content setting failed:",
              err4?.message || "Unknown error"
            );
            throw err3; // Throw the original navigation error
          }
        }
      }
    }

    console.log("Page loaded, waiting for #status element");

    // Wait for the status element to be present first
    console.log("🔍 Waiting for #status element to appear...");
    try {
      await page.waitForSelector("#status", { timeout: 10000 });
      console.log("✅ Status element found, waiting for content");
    } catch (err) {
      console.log("❌ Status element not found within 10 seconds");
      console.log("🔍 Taking screenshot and checking page content...");

      try {
        await page.screenshot({ format: "png" });
        console.log("📸 Screenshot captured");

        const html = await page.content();
        console.log(
          "📄 Page HTML (first 1000 chars):",
          html.substring(0, 1000)
        );

        // Check if there are any script errors
        const scripts = await page.evaluate(() => {
          const scriptTags = document.querySelectorAll("script");
          return Array.from(scriptTags).map((s) => ({
            src: s.src,
            type: s.type,
            hasError: s.hasAttribute("data-error"),
          }));
        });
        console.log("📜 Script tags found:", scripts);
      } catch (debugErr) {
        console.log("Could not capture debug info:", debugErr);
      }

      throw new Error(
        "Status element not found - test page may not be loading correctly"
      );
    }

    // Wait a bit for the content to populate
    await page.waitForTimeout(2000);

    // Check if the script tag is actually present and has the right src
    const scriptSrc = await page.evaluate(() => {
      const script = document.querySelector(
        'script[type="module"]'
      ) as HTMLScriptElement;
      return script ? script.src : "No module script found";
    });
    console.log(`📜 Script src found: ${scriptSrc}`);

    // Check if the script is actually loading
    try {
      const scriptResponse = await fetch(scriptSrc);
      console.log(
        `📁 Script loading check: ${scriptResponse.status} ${scriptResponse.statusText}`
      );
      if (scriptResponse.ok) {
        console.log("✅ Script is accessible from the page");
      } else {
        console.log("❌ Script is not accessible from the page");
      }
    } catch (err) {
      console.log("❌ Script loading check failed:", err);
    }

    // Check current status content
    const statusText = await page.evaluate(() => {
      const el = document.querySelector("#status");
      return el ? el.textContent : "No status element";
    });
    console.log(`Current status text: "${statusText}"`);

    // Wait for tests to actually start running
    let attempts = 0;
    const maxAttempts = 10;
    const startTime = Date.now();
    const maxWaitTime = 30000; // 30 seconds max wait

    while (attempts < maxAttempts) {
      const elapsed = Date.now() - startTime;
      if (elapsed > maxWaitTime) {
        console.log(
          `⏰ Timeout waiting for tests to start (${maxWaitTime / 1000}s)`
        );
        break;
      }

      const { isRunning, status, hasIframes } = await checkTestStatus(page);
      console.log(
        `Attempt ${
          attempts + 1
        }: Status="${status}" | Running=${isRunning} | Iframes=${hasIframes} | Elapsed: ${Math.floor(
          elapsed / 1000
        )}s`
      );

      if (isRunning || hasIframes) {
        console.log(
          "✅ Tests appear to be running, proceeding with monitoring..."
        );
        break;
      }

      if (attempts === maxAttempts - 1) {
        console.log(
          "⚠️ Tests do not appear to be running after multiple attempts"
        );

        // Check if the script is actually executing by looking for any console output
        console.log("🔍 Checking if test script is executing...");
        try {
          // Check if the metapage instance was created
          const hasMetapageInstance = await page.evaluate(() => {
            return typeof (window as any).metapageInstance !== "undefined";
          });
          console.log(`📊 Metapage instance exists: ${hasMetapageInstance}`);

          // Check if the Metapage class is available
          const hasMetapageClass = await page.evaluate(() => {
            return typeof (window as any).Metapage !== "undefined";
          });
          console.log(`📊 Metapage class exists: ${hasMetapageClass}`);

          // Check if there are any JavaScript errors
          const jsErrors = await page.evaluate(() => {
            const errors: string[] = [];
            if ((window as any).onerror) {
              errors.push("Window has error handler");
            }
            return errors;
          });
          console.log(`🚨 JavaScript errors: ${jsErrors}`);

          // Check if the test script has run at all
          const hasTestRun = await page.evaluate(() => {
            return typeof (window as any).TESTS !== "undefined";
          });
          console.log(`📊 TESTS array exists: ${hasTestRun}`);

          // Check if there are any iframes (indicating metapage is working)
          const iframeCount = await page.evaluate(() => {
            return document.querySelectorAll("iframe").length;
          });
          console.log(`📊 Iframe count: ${iframeCount}`);
        } catch (debugErr) {
          console.log("Could not check script execution status:", debugErr);
        }

        // Enhanced debugging: Check what's actually on the page
        try {
          console.log("🔍 Debugging test execution...");

          // Check if the test script tag exists
          const scriptTags = await page.evaluate(() => {
            const scripts = document.querySelectorAll("script");
            return Array.from(scripts).map((s) => ({
              src: s.src,
              type: s.type,
              content: s.textContent
                ? s.textContent.substring(0, 100) + "..."
                : "No content",
            }));
          });
          console.log("📜 Script tags found:", scriptTags);

          // Check if there are any console errors
          console.log("📝 Checking for console errors...");

          // Check for any JavaScript errors on the page
          const pageErrors = await page.evaluate(() => {
            const errors: string[] = [];
            if (window.onerror) {
              // This is a basic check - in a real scenario you'd want to capture actual errors
              errors.push("Window has error handler");
            }
            return errors;
          });
          console.log("🚨 Page errors found:", pageErrors);

          // Check page content for clues
          const bodyContent = await page.evaluate(() => {
            const body = document.querySelector("#body");
            return body ? body.innerHTML.substring(0, 500) : "No body element";
          });
          console.log("📄 Body content:", bodyContent);

          // Check if the test script file is accessible
          const testScriptUrl = `${serverOrigin}/test/metapage/${type}/metapage-test.js`;
          try {
            console.log(
              `🔍 Checking test script accessibility: ${testScriptUrl}`
            );
            const scriptResponse = await fetch(testScriptUrl);
            console.log(
              `📁 Test script accessibility: ${scriptResponse.status} ${scriptResponse.statusText}`
            );

            if (scriptResponse.ok) {
              const scriptContent = await scriptResponse.text();
              console.log(
                `📜 Test script content (first 200 chars): ${scriptContent.substring(
                  0,
                  200
                )}`
              );

              // Check if the script content looks valid
              if (
                scriptContent.includes("console.log") ||
                scriptContent.includes("function")
              ) {
                console.log("✅ Test script content appears valid");
              } else {
                console.log("⚠️ Test script content may be invalid or empty");
              }
            } else {
              console.log(
                `❌ Test script returned error status: ${scriptResponse.status}`
              );
            }
          } catch (err) {
            console.log(`❌ Test script fetch error:`, err);
          }

          // Check if the library file is accessible
          const libraryUrl = `${serverOrigin}/lib/metapage/index.js`;
          try {
            console.log(`🔍 Checking library accessibility: ${libraryUrl}`);
            const libraryResponse = await fetch(libraryUrl);
            console.log(
              `📁 Library accessibility: ${libraryResponse.status} ${libraryResponse.statusText}`
            );

            if (libraryResponse.ok) {
              const libraryContent = await libraryResponse.text();
              console.log(
                `📜 Library content (first 200 chars): ${libraryContent.substring(
                  0,
                  200
                )}`
              );

              // Check if the library content looks valid
              if (
                libraryContent.includes("export") ||
                libraryContent.includes("Metapage")
              ) {
                console.log("✅ Library content appears valid");
              } else {
                console.log("⚠️ Library content may be invalid or empty");
              }
            } else {
              console.log(
                `❌ Library returned error status: ${libraryResponse.status}`
              );
            }
          } catch (err) {
            console.log(`❌ Library fetch error:`, err);
          }
        } catch (debugErr) {
          console.log("Could not perform enhanced debugging:", debugErr);
        }

        // Continue anyway, the monitoring function will handle timeouts
      }

      await page.waitForTimeout(1000);
      attempts++;
    }
  } catch (err) {
    console.error("Error loading page or finding status element:", err);
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
        const el = document.querySelector("#status");
        return el ? el.textContent : "No status element";
      });

      if (statusText && statusText.includes("TESTS FAIL")) {
        console.log("💥💥💥   FAIL: browser says:      🤦‍♀️🤦‍♀️🤦‍♀️");
        console.error(statusText);
        testFailed = true;
        if (headless) {
          await shutdownServer();
          Deno.exit(1);
        }
        break;
      }

      if (statusText && statusText.includes("METAPAGE TESTS PASS")) {
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
    console.log("Error checking test status:", err);
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
          const el = document.querySelector("#status");
          return el ? el.textContent : "No status element";
        });

        if (statusText && statusText.includes("METAPAGE TESTS PASS")) {
          console.log(`🍀🍀🍀   SUCCESS version:${version}   🍾🍾🍾 `);
          await browser.close();
          return;
        }

        attempts++;
        await page.waitForTimeout(1000);
      }
    }

    // Add a final check to see if we're stuck
    console.log("🔍 Final status check before timeout...");
    const finalStatus = await page.evaluate(() => {
      const el = document.querySelector("#status");
      return el ? el.textContent : "No status element";
    });
    console.log(`📊 Final status: "${finalStatus}"`);

    // If we get here, the test didn't complete in time
    console.log("⏰ Test did not complete within timeout period");

    console.log(`🍀🍀🍀   SUCCESS version:${version}   🍾🍾🍾 `);
    await browser.close();
  } catch (err) {
    console.log(`💥💥💥   fail version:${version} TIMEOUT`);

    // Enhanced debugging for headless mode failures
    if (headless) {
      try {
        const finalStatus = await page.evaluate(() => {
          const el = document.querySelector("#status");
          return el ? el.textContent : "No status element";
        });
        console.log(`Final status content: "${finalStatus}"`);

        // Take a screenshot for debugging
        await page.screenshot({ format: "png" });
        console.log(`Screenshot captured`);

        // Get page HTML for debugging
        const html = await page.content();
        console.log("Page HTML (first 1000 chars):", html.substring(0, 1000));
      } catch (debugErr) {
        console.log("Could not capture debug info:", debugErr);
      }
    }

    await browser.close();
    await shutdownServer();
    Deno.exit(1);
  }
}

const getMetapageTestUrl = (test: TestType, version: string) => {
  // https://metapage-npm.dev:4441/test/metapage/compatibility/
  // return `${serverOrigin}/test/metapage/${test}/${version}${
  return `${serverOrigin}/test/metapage/${test}/${version}${
    debugMetapage ? "?debug=true" : ""
  }`;
};

const getMetapageVersions = async (): Promise<string[]> => {
  const resp = await fetch(`${serverOrigin}/versions/metapages/metapage`);
  let versions = await resp.json();
  // remove versions we know don't pass
  versions = versions.filter((v: string) => compareVersions(v, "0.16.2") > 0);
  return versions;
};

const getRepresentativeMetapageVersions = async (): Promise<string[]> => {
  let versions = await getMetapageVersions();
  // Only most recent x.y versions
  // versions are already sorted
  const minorLimit = 0;
  const subset: string[] = [];
  let currentMajor = 10000;
  let currentMinor = 10000;
  let minors = 0;
  for (const version of versions) {
    const [x, y] = version.split(".").map((v) => parseInt(v));
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
for (const testType of [
  "io-pipe-names",
  "globs",
  "first-message",
  "compatibility",
] as TestType[]) {
  for (const version of allVersions) {
    if (
      version !== "latest" &&
      testType === "globs" &&
      compareVersions(version, "1.1.0") < 0
    ) {
      console.log(
        `🍳👉 skipping ${testType} test for version ${version} because < 1.1.0`
      );
      continue;
    }

    if (
      version !== "latest" &&
      testType === "io-pipe-names" &&
      compareVersions(version, "1.2.2") <= 0
    ) {
      console.log(
        `🍳👉 skipping ${testType} test for version ${version} because <= 1.2.2`
      );
      continue;
    }

    console.log(`\n🚀 Starting test: ${testType} for version: ${version}`);
    console.log(
      `⏱️  Test timeout: ${(timePerTest * allVersions.length) / 1000}s`
    );
    console.log(`🔍 Headless mode: ${headless}`);

    try {
      await runSingleMetapageTest(
        testType,
        version,
        timePerTest * allVersions.length
      );
      console.log(`✅ Test completed successfully: ${testType} - ${version}`);
    } catch (err) {
      console.error(`❌ Test failed: ${testType} - ${version}`, err);
      if (headless) {
        console.log(
          `💡 Debug info: Check the screenshot and HTML output above for more details`
        );
        console.log(
          `💡 You can also run with --disable-headless to see the browser window`
        );
        console.log(
          `💡 Or run with --browser-console-stdout to see browser console output`
        );
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
