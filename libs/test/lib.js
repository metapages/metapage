const compareVersions = require('compare-versions');
const fs = require('fs');
const path = require('path');
const util = require('util');
const doT = require('dot');
const exec = util.promisify(require('child_process').exec);
doT.templateSettings.strip = false

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
    // <0.1.36 removed because they are were unpolished prototypes
    // <0.3 removed because there was a fatal (hidden) bug in the metapage lib, found when automated tests added
    // <0.3.3 removed because there was a subtle bug setting inputs.
    versions = versions.filter((v) => {
        return compareVersions(v, "0.3.2") >= 0;
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

const generate = async () => {
    // input
    const allVersions = await getMetapageVersions();
    var data = { environment: "production", versions:allVersions };
    // console.log('data', data);

    const template = fs.readFileSync('./page/index.template.html');//"Hey, look over there! It's {{=it.thatThingOverThere}}!"
    const tempFunc = doT.template(template);
    var html = tempFunc(data);

    fs.writeFileSync('./page/index.html', html);
}

module.exports = { getMetapageVersions, generate };
