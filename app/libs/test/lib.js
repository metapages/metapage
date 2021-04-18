const compareVersions = require('compare-versions');
const fs = require('fs');
const path = require('path');
const util = require('util');
const doT = require('dot');
const exec = util.promisify(require('child_process').exec);
doT.templateSettings.strip = false

/**
 * Get all supported metapage/frame versions that we support (forever)
 * { includeLocal: boolean }
 */
const getMetapageVersions = async (args) => {
  const {includeLocal} = args || {};
  const package = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')).name;
  const { stdout, stderr } = await exec(`npm show ${package} versions --json`);
  if (stderr) {
    console.error(`error: ${stderr}`);
    throw `error: ${stderr}`;
  }
  let versions = JSON.parse(stdout);
  // This is old, and doesn't apply to @metapages/metapage but to metapage
  // but keeping here as a record of how to deal with incompatabilities over time
  // damn I can't remove the old versions installed that definitely
  // will never be supported
  // <0.1.36 removed because they are were unpolished prototypes
  // <0.3 removed because there was a fatal (hidden) bug in the metapage lib, found when automated tests added
  // <0.3.3 removed because there was a subtle bug setting inputs.
  // versions = versions.filter((v) => {
  //   return compareVersions(v, "0.3.2") >= 0 && v !== '0.4.101';
  // });

  // Include the new version in package.json, because we're publishing
  if (includeLocal) {
    var packageJson = fs.readFileSync(path.join(__dirname, '../package.json')).toString();
    var current = JSON.parse(packageJson).version;
    if (versions.indexOf(current) == -1) {
      versions.push(current);
    }
  }
  return versions;
}

const generate = async (args) => {
  const allVersions = await getMetapageVersions();
  // input
  const data = { environment: "production", versions: allVersions };
  if (args && args.environment && args.environment.length > 0) {
    data.environment = args.environment;
  }
  const template = fs.readFileSync(path.join(__dirname, './page/index.template.html'));
  const tempFunc = doT.template(template);
  var html = tempFunc(data);
  fs.writeFileSync('./page/index.html', html);
}

// serve the pages to the puppeteer browser
const createServer = async (port) => {
  const server = require('fastify')({ logger: false })
  const path = require('path')
  server.register(require('fastify-static'), {
    root: path.join(__dirname, 'page'),
    prefix: '/',
  })

  try {
    const address = await server.listen(port, '0.0.0.0');
    server.log.info(`🚀 🍀😎 server listening on ${address}`);
  } catch (err) {
    console.error(`Failed to start`, err);
    server.log.error(err)
    process.exit(1);
  }
  return server;
}

module.exports = { getMetapageVersions, generate, createServer };
