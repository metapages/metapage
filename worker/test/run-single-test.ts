#!/usr/bin/env -S deno run -A

/**
 * Run a single test with enhanced debugging
 * This helps isolate issues with specific test types or versions
 */

import { launch } from 'jsr:@astral/astral';

const flags = parse(Deno.args);

const testType = flags.testType || 'compatibility';
const version = flags.version || 'latest';
const headless = !flags.disableHeadless;
const debugMetapage = flags.debugMetapage || false;
const consoleToLogs = flags.browserConsoleStdout || false;

const serverOrigin = 'https://localhost:8762';

async function runSingleTest() {
  console.log(`🔍 Running single test: ${testType} - ${version}`);
  console.log(`🔍 Headless: ${headless}`);
  console.log(`🔍 Debug: ${debugMetapage}`);
  
  const browser = await launch({
    headless: headless,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
    ],
    dumpio: consoleToLogs,
    defaultViewport: { width: 1280, height: 720 },
  });

  const page = await browser.newPage();

  const url = `${serverOrigin}/test/metapage/${testType}/${version}${debugMetapage ? "?debug=true" : ""}`;
  console.log(`🚀 URL: ${url}`);

  try {
    await page.goto(url, { waitUntil: 'networkidle2' });
    console.log('✅ Page loaded');

    await page.waitForSelector('#status', { timeout: 10000 });
    console.log('✅ Status element found');

    // Monitor for completion
    const startTime = Date.now();
    const checkInterval = setInterval(async () => {
      try {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        console.log(`[${elapsed}s] Checking status...`);
        
        // Check if tests are complete
        const statusText = await page.evaluate(() => {
          const el = document.querySelector('#status');
          return el ? el.textContent : 'No status element';
        });
        
        console.log(`Status: "${statusText}"`);
        
        if (statusText && statusText.includes('METAPAGE TESTS PASS')) {
          console.log('🎉 Tests passed!');
          clearInterval(checkInterval);
          await browser.close();
          Deno.exit(0);
        } else if (statusText && statusText.includes('TESTS FAIL')) {
          console.log('💥 Tests failed!');
          clearInterval(checkInterval);
          await browser.close();
          Deno.exit(1);
        }
        
        // Timeout after 5 minutes
        if (elapsed > 300) {
          console.log('⏰ Test timeout reached');
          clearInterval(checkInterval);
          await browser.close();
          Deno.exit(1);
        }
        
      } catch (err) {
        console.log('Error checking status:', err);
      }
    }, 5000);

  } catch (err) {
    console.error('❌ Error:', err);
    await browser.close();
    Deno.exit(1);
  }
}

// Parse command line arguments
function parse(args: string[]) {
  const parsed: Record<string, any> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith('--')) {
        parsed[key] = nextArg;
        i++;
      } else {
        parsed[key] = true;
      }
    }
  }
  return parsed;
}

// Main execution
if (import.meta.main) {
  runSingleTest();
}
