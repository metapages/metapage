/**
 * Reproduces the three ways the parent metapage hits
 * "Failed to execute 'postMessage' on 'DOMWindow': The target origin provided
 * (...) does not match the recipient window's origin (...)"
 * See ./40-postmessage-origin-mismatch.md
 *
 * Needs a running stack serving /lib/index.js (just pr-daemon-up, or the dev server):
 *   NODE_PATH=lib/node_modules ORIGIN=https://<stack> node discussions/40-postmessage-origin-probe.cjs
 */
const { chromium } = require("playwright");
const ORIGIN = process.env.ORIGIN ||
  "https://40-postmessage-origin-mismatch.home.dionjw.dev";

async function run(name, urlA, urlB) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  const errs = [];
  page.on("console", (m) => {
    if (/postMessage/.test(m.text())) errs.push(`${m.type()}: ${m.text()}`);
  });
  page.on("pageerror", (e) => errs.push(`pageerror: ${e.message}`));
  // Stands in for any real cross-origin redirect (http->https, www->apex, ...)
  await ctx.route("https://redirect.test/**", (r) =>
    r.fulfill({ status: 302, headers: { location: "https://js.mtfm.io/" } }));
  await page.goto(ORIGIN + "/", { waitUntil: "load" });
  await page.evaluate(async ([urlA, urlB]) => {
    const { Metapage } = await import("/lib/index.js");
    const mp = await Metapage.from({
      version: "2",
      metaframes: { a: { url: urlA } },
    });
    const mf = mp.getMetaframe("a");
    let registered = 0;
    const orig = mf.registered.bind(mf);
    mf.registered = (v) => (registered++, orig(v));
    document.body.innerHTML = "";
    document.body.appendChild(await mf.iframe);
    window.__probe = () => ({ registered, src: mf._iframe.src.slice(0, 60) });
    if (urlB) {
      await new Promise((r) => setTimeout(r, 4000));
      const def = JSON.parse(JSON.stringify(mp.getDefinition()));
      def.metaframes.a.url = urlB;
      // keep inputs flowing across the url swap
      let i = 0;
      const t = setInterval(() => mp.setInputs({ a: { x: i++ } }), 5);
      setTimeout(() => clearInterval(t), 1500);
      await mp.setDefinition(def);
    }
  }, [urlA, urlB]);
  await page.waitForTimeout(6000);
  const state = await page.evaluate(() => window.__probe());
  const uniq = [...new Set(errs)];
  console.log(`\n=== ${name}\n${JSON.stringify(state)}`);
  console.log(`postMessage errors: ${errs.length} (${uniq.length} unique)`);
  uniq.forEach((e) => console.log(`  ${e.slice(0, 260)}`));
  await browser.close();
}

(async () => {
  const dataUrl = "data:text/html," + encodeURIComponent(
    `<script type="module">const {Metaframe}=await import("${ORIGIN}/lib/index.js");new Metaframe();</script>`,
  );
  await run("baseline: https://js.mtfm.io/", "https://js.mtfm.io/");
  await run("1. cross-origin redirect", "https://redirect.test/");
  await run("2. data: url metaframe", dataUrl);
  await run(
    "3. setDefinition changes url origin while inputs flow",
    "https://js.mtfm.io/",
    "https://markdown.mtfm.io/",
  );
})();
