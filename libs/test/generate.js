const doT = require('dot');
const fs = require('fs');
const versions = require('./versions');

doT.templateSettings.strip = false

const run = async () => {
    // input
    const allVersions = await versions.getMetapageVersions();
    var data = { environment: "production", versions:allVersions };
    // console.log('data', data);

    const template = fs.readFileSync('./page/index.template.html');//"Hey, look over there! It's {{=it.thatThingOverThere}}!"
    const tempFunc = doT.template(template);
    var html = tempFunc(data);

    fs.writeFileSync('./page/index.html', html);
}

run();
