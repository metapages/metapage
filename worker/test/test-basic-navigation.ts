#!/usr/bin/env -S deno run -A

/**
 * Basic navigation test to verify headless mode works
 */

import { launch } from 'jsr:@astral/astral';

const serverOrigin = 'https://localhost:8762';

async function testBasicNavigation() {
  console.log('🔍 Testing basic navigation in headless mode...');
  
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

  try {
    // Test 1: Simple page
    console.log('🚀 Test 1: Navigating to simple page...');
    await page.goto(`${serverOrigin}/`, { waitUntil: 'load' });
    console.log('✅ Simple page loaded successfully');
    
    // Test 2: Test page
    console.log('🚀 Test 2: Navigating to test page...');
    await page.goto(`${serverOrigin}/test/metapage/io-pipe-names/latest`, { waitUntil: 'load' });
    console.log('✅ Test page loaded successfully');
    
    // Test 3: Check if status element exists
    console.log('🔍 Test 3: Checking for status element...');
    const statusExists = await page.evaluate(() => {
      const el = document.querySelector('#status');
      return el ? true : false;
    });
    console.log(`✅ Status element exists: ${statusExists}`);
    
    // Test 4: Check page title
    const title = await page.evaluate(() => document.title);
    console.log(`📄 Page title: "${title}"`);
    
    console.log('🎉 All basic navigation tests passed!');
    
  } catch (err) {
    console.error('❌ Navigation test failed:', err);
  } finally {
    await browser.close();
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
      testBasicNavigation();
    } else {
      console.log('❌ Server is not running. Please start the server first with: deno task start');
      Deno.exit(1);
    }
  });
}
