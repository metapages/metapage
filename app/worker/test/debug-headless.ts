#!/usr/bin/env -S deno run -A

/**
 * Simple debug script for headless mode issues
 * This script helps identify why headless tests are timing out
 */

import { launch } from 'jsr:@astral/astral';

const serverOrigin = 'https://localhost:8762';
const testType = 'compatibility';
const version = 'latest';

async function debugHeadlessTest() {
  console.log('🔍 Debugging headless mode for:', testType, version);
  
  const browser = await launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
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
      "--single-process"
    ],
    dumpio: true,
    defaultViewport: { width: 1280, height: 720 },
  });

  const page = await browser.newPage();

  const url = `${serverOrigin}/test/metapage/${testType}/${version}`;
  console.log('🚀 Navigating to:', url);

  try {
    await page.goto(url, { 
      waitUntil: 'networkidle2'
    });
    console.log('✅ Page loaded successfully');

    // Wait for status element
    await page.waitForSelector('#status', { timeout: 10000 });
    console.log('✅ Status element found');

    // Simple monitoring - just log what we see
    console.log('🔍 Monitoring test progress...');
    
    // Wait for tests to complete or timeout
    setTimeout(async () => {
      console.log('⏰ Test timeout reached, taking debug info...');
      
      try {
        // Get page content for debugging
        const html = await page.content();
        console.log('📄 Page HTML (first 2000 chars):', html.substring(0, 2000));
        
      } catch (err) {
        console.log('❌ Error capturing debug info:', err);
      }
      
      await browser.close();
      Deno.exit(1);
    }, 120000); // 2 minute timeout

  } catch (err) {
    console.error('❌ Error during test:', err);
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
      debugHeadlessTest();
    } else {
      console.log('❌ Server is not running. Please start the server first with: deno task start');
      Deno.exit(1);
    }
  });
}
