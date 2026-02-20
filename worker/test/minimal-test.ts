#!/usr/bin/env -S deno run -A

/**
 * Minimal test script using only basic Astral API
 * This avoids compatibility issues with advanced features
 */

import { launch } from 'jsr:@astral/astral';

const serverOrigin = 'https://localhost:8762';
const testType = 'compatibility';
const version = 'latest';

async function runMinimalTest() {
  console.log('🔍 Running minimal test:', testType, version);
  
  const browser = await launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
    dumpio: true,
  });

  const page = await browser.newPage();

  const url = `${serverOrigin}/test/metapage/${testType}/${version}`;
  console.log('🚀 URL:', url);

  try {
    // Navigate to the test page
    await page.goto(url);
    console.log('✅ Page loaded');

    // Wait for status element
    await page.waitForSelector('#status', { timeout: 10000 });
    console.log('✅ Status element found');

    // Simple polling to check test status
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    
    while (attempts < maxAttempts) {
      const statusText = await page.evaluate(() => {
        const el = document.querySelector('#status');
        return el ? el.textContent : 'No status element';
      });
      
      console.log(`[${attempts * 5}s] Status: "${statusText}"`);
      
      if (statusText && statusText.includes('METAPAGE TESTS PASS')) {
        console.log('🎉 Tests passed!');
        await browser.close();
        Deno.exit(0);
      }
      
      if (statusText && statusText.includes('TESTS FAIL')) {
        console.log('💥 Tests failed!');
        await browser.close();
        Deno.exit(1);
      }
      
      attempts++;
      await page.waitForTimeout(5000); // Wait 5 seconds between checks
    }
    
    console.log('⏰ Test timeout reached');
    await browser.close();
    Deno.exit(1);

  } catch (err) {
    console.error('❌ Error:', err);
    await browser.close();
    Deno.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(serverOrigin);
    if (response.ok) {
      console.log('✅ Server is running');
      return true;
    }
  } catch (err) {
    console.log('❌ Server check failed:', err);
  }
  return false;
}

// Main execution
if (import.meta.main) {
  checkServer().then((isRunning) => {
    if (isRunning) {
      runMinimalTest();
    } else {
      console.log('❌ Server is not running. Please start the server first with: deno task start');
      Deno.exit(1);
    }
  });
}
