const compareVersions = require('compare-versions');
const fs = require('fs');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

/**
 * Get all supported metapage/frame versions that we support (forever)
 */
const getMetapageVersions = async (includeCurrent) => {
    const { stdout, stderr } = await exec('npm show --json metapage versions');
    if (stderr) {
        console.error(`error: ${stderr}`);
        throw `error: ${stderr}`;
    }
    let versions = JSON.parse(stdout);
    // damn I can't remove the old versions installed that definitely
    // will never be supported
    versions = versions.filter((v) => {
        return compareVersions("0.1.36", v) <= 0;
    });

    // Include the new version in package.json, because we're publishing
    if (includeCurrent) {
        var packageJson = fs.readFileSync(path.join(__dirname, '../package.json')).toString();
        var current = JSON.parse(packageJson).version;
        if (versions.indexOf(current) == -1) {
            versions.push(current);
        }
    }
    return versions;
}

module.exports = { getMetapageVersions };
