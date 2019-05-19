# just docs: https://github.com/casey/just

help:
    @just --list

# Run the stack, defaulting to all. Just target "jekyll" for a minimal server
run +TARGET='jekyll builder-haxe test':
    docker-compose up --remove-orphans {{TARGET}}

metapage-app:
    just sites/metapage-app/serve


# Idempotent version update where they are used
versions-update versions-write-versions-to-jekyll:

# Write library versions to the place where jekyll can consume:
# docs/_data/versions.yml
versions-write-versions-to-jekyll:
    #!/usr/bin/env node
    var Versions = require(process.cwd() + '/libs/test/versions.js');
    var fs = require('fs');
    var p = Versions.getMetapageVersions(true);
    p.then((versions) => { var out = 'versions: ' + JSON.stringify(versions); console.log('./docs/_data/versions.yml:\n' + out + '\n'); fs.writeFileSync('./docs/_data/versions.yml', out + '\n')});
