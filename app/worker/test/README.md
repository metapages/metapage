# Debugging Headless Test Timeouts

This directory contains tools to help debug why headless tests are timing out while working in the browser.

## ⚠️ Current Status

**API Compatibility Issue**: The current version of Astral has different API methods than expected. The main test runner has been updated to use compatible methods, but some advanced features may not work.

## Problem

The headless tests are timing out with the error:
```
💥💥💥   fail version:${version} TIMEOUT
```

## Debugging Tools

### 1. Enhanced Test Runner (Fixed)

The main test runner (`src/run-tests-in-astral.ts`) has been updated to:

- **Use compatible API methods**: Replaced `page.on()` and `waitForFunction` with `page.evaluate()`
- **Increased timeouts**: 60s for headless vs 20s for browser mode
- **Better browser configuration**: Additional Chrome flags for headless stability
- **Enhanced logging**: More detailed progress monitoring
- **Progress monitoring**: Real-time status updates

### 2. Minimal Test Script (Recommended)

A minimal test script (`minimal-test.ts`) that uses only basic Astral API methods:

```bash
deno run -A test/minimal-test.ts
```

### 3. Debug Scripts

- **`debug-headless.ts`**: Simple debug script (may have API compatibility issues)
- **`run-single-test.ts`**: Run individual tests (may have API compatibility issues)

## Usage

### Run Enhanced Tests (Fixed)

```bash
# Run with enhanced debugging
cd app/worker
deno task start  # In another terminal
deno run -A test/src/run-tests-in-astral.ts --browser-console-stdout

# Run without headless mode to see what's happening
deno run -A test/src/run-tests-in-astral.ts --disable-headless

# Run with metapage debugging
deno run -A test/src/run-tests-in-astral.ts --debug-metapage
```

### Run Minimal Test (Recommended)

```bash
cd app/worker
deno task start  # In another terminal
deno run -A test/minimal-test.ts
```

## API Compatibility Notes

The current Astral version doesn't support:
- `page.on()` event handlers
- `page.waitForFunction()` with polling options
- `page.$eval()` method
- Some screenshot options

**Workarounds implemented**:
- Use `page.evaluate()` for DOM queries
- Implement custom polling instead of `waitForFunction`
- Use basic screenshot functionality
- Rely on `dumpio: true` for console output

## Common Issues and Solutions

### 1. Tests Not Starting

**Symptoms**: Status shows "status" and never changes
**Causes**: 
- JavaScript errors preventing test execution
- Missing dependencies
- Network issues loading test files

**Solutions**:
- Check browser console for errors
- Verify all test files are accessible
- Run with `--browser-console-stdout` to see console output

### 2. Tests Hanging

**Symptoms**: Status shows tests are running but never complete
**Causes**:
- Infinite loops in test code
- Deadlocks in iframe communication
- Resource loading issues

**Solutions**:
- Check for infinite loops in test JavaScript
- Verify iframe communication is working
- Run with `--disable-headless` to see browser behavior

### 3. Timeout Issues

**Symptoms**: Tests timeout before completion
**Causes**:
- Tests are too slow in headless mode
- Resource contention
- Browser throttling in headless mode

**Solutions**:
- Increase timeout values
- Add `--disable-background-timer-throttling` flag
- Run with `--disable-headless` to compare performance

## Browser Configuration

The enhanced test runner uses these Chrome flags for headless stability:

```bash
--disable-background-timer-throttling
--disable-backgrounding-occluded-windows
--disable-renderer-backgrounding
--disable-features=TranslateUI
--disable-ipc-flooding-protection
--no-first-run
--no-default-browser-check
--disable-default-apps
--disable-extensions
--disable-plugins
--disable-sync
--disable-translate
--hide-scrollbars
--mute-audio
--no-zygote
--single-process
```

## Debugging Steps

1. **Start with minimal test**: Use `minimal-test.ts` to verify basic functionality
2. **Run enhanced runner**: Use the updated test runner with `--browser-console-stdout`
3. **Compare headless vs browser**: Use `--disable-headless`
4. **Check test progress**: Monitor status element changes
5. **Analyze console**: Look for JavaScript errors or warnings

## Next Steps

If tests still fail:

1. **Use minimal test first**: Verify basic functionality works
2. **Check API compatibility**: Ensure all methods used are supported
3. **Compare with working version**: Run in browser mode to see differences
4. **Check server logs**: Look for server-side issues
5. **Verify test files**: Ensure all test resources are accessible

## Troubleshooting API Issues

If you encounter API compatibility errors:

1. **Check Astral version**: Ensure you're using a compatible version
2. **Use minimal methods**: Stick to basic `page.goto()`, `page.evaluate()`, etc.
3. **Avoid advanced features**: Don't use `page.on()`, `waitForFunction`, etc.
4. **Implement alternatives**: Use custom polling instead of built-in waiting
5. **Check documentation**: Refer to current Astral API documentation
