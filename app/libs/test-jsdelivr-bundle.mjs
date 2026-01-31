#!/usr/bin/env node
/**
 * Pre-publish verification script.
 *
 * This script verifies the package is ready for publishing by:
 * 1. Checking that dist/ directory exists with required files
 * 2. Verifying npm pack includes dist/ files
 * 3. Simulating jsDelivr's Rollup bundling (uses Rollup v2.79.2)
 *
 * Usage: node test-jsdelivr-bundle.mjs
 *
 * Run this BEFORE `npm publish` to catch issues that would break CDN delivery.
 */

import { rollup } from "rollup";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync, statSync } from "fs";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let allPassed = true;

function fail(message) {
  console.error(`❌ ${message}`);
  allPassed = false;
}

function pass(message) {
  console.log(`✅ ${message}`);
}

// Test 1: Check dist/ directory exists
function checkDistExists() {
  console.log("\n📦 Test 1: Checking dist/ directory...");

  const distPath = join(__dirname, "dist");
  if (!existsSync(distPath)) {
    fail('dist/ directory does not exist! Run "just build" first.');
    return false;
  }

  const indexJsPath = join(distPath, "index.js");
  if (!existsSync(indexJsPath)) {
    fail("dist/index.js does not exist!");
    return false;
  }

  const stats = statSync(indexJsPath);
  if (stats.size < 10000) {
    fail(
      `dist/index.js is suspiciously small (${stats.size} bytes). Build may have failed.`,
    );
    return false;
  }

  pass(`dist/index.js exists (${(stats.size / 1024).toFixed(1)} KB)`);
  return true;
}

// Test 2: Verify npm pack includes dist/
function checkNpmPack() {
  console.log("\n📦 Test 2: Checking npm pack contents...");

  try {
    const output = execSync("npm pack --dry-run 2>&1", {
      cwd: __dirname,
      encoding: "utf-8",
    });

    const distFileCount = (output.match(/dist\//g) || []).length;
    const totalFiles = output.match(/total files:\s*(\d+)/i);

    if (distFileCount === 0) {
      fail(
        "npm pack does NOT include any dist/ files! Check .npmignore and files field in package.json.",
      );
      console.log(
        "   Hint: Make sure dist/ is built and not excluded by .npmignore",
      );
      return false;
    }

    if (distFileCount < 5) {
      fail(
        `npm pack only includes ${distFileCount} dist/ files. Expected many more.`,
      );
      return false;
    }

    pass(
      `npm pack includes ${distFileCount} dist/ files (${totalFiles ? totalFiles[1] : "?"} total files)`,
    );
    return true;
  } catch (error) {
    fail(`npm pack failed: ${error.message}`);
    return false;
  }
}

// Test 3: Simulate jsDelivr Rollup bundling
async function testJsDelivrBundle() {
  console.log("\n📦 Test 3: Simulating jsDelivr bundling (Rollup v2.79.2)...");

  try {
    const bundle = await rollup({
      input: join(__dirname, "dist/index.js"),
      plugins: [
        nodeResolve({
          browser: true,
          preferBuiltins: false,
        }),
        commonjs(),
      ],
      onwarn(warning, warn) {
        // Only log critical warnings
        if (
          warning.code === "UNRESOLVED_IMPORT" ||
          warning.code === "MISSING_EXPORT" ||
          warning.code === "THIS_IS_UNDEFINED"
        ) {
          console.log(`   ⚠️  ${warning.code}: ${warning.message}`);
        }
      },
    });

    const { output } = await bundle.generate({
      format: "es",
      sourcemap: false,
    });

    await bundle.close();

    const sizeKB = (output[0].code.length / 1024).toFixed(1);
    pass(`jsDelivr-style bundle generated successfully (${sizeKB} KB)`);
    return true;
  } catch (error) {
    fail(`jsDelivr bundling failed: ${error.message}`);
    if (error.code) {
      console.error(`   Code: ${error.code}`);
    }
    if (error.loc) {
      console.error(`   Location: ${JSON.stringify(error.loc)}`);
    }
    return false;
  }
}

// Run all tests
async function main() {
  console.log("🔍 Pre-publish verification for @metapages/metapage");
  console.log(
    "   This ensures the package will work on jsDelivr and other CDNs.\n",
  );

  checkDistExists();
  checkNpmPack();
  await testJsDelivrBundle();

  console.log("\n" + "=".repeat(60));
  if (allPassed) {
    console.log("✅ All checks passed! Safe to publish.");
    process.exit(0);
  } else {
    console.log("❌ Some checks failed. DO NOT PUBLISH until fixed.");
    process.exit(1);
  }
}

main();
