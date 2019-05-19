
Developing:

    make run

Then compile with:

    make shell-haxe
    make compile

Updating jekyll gems:

    # Add gem to Gemfile
    make jekyll-shell
    cd docs && bundle install

Publishing:

    # release a new patch version
    make publish-new-version
    OR
    NEW_VERSION=<patch|exact semver|etc> make publish-new-version
    E.G.:
    NEW_VERSION=0.2.0 make publish-new-version

    # create a new library version (as automated as possible)
    # 1. ensure the version is good in haxe. change haxe versions rarely, these correspond to major API versions
    # 2. ensure any hard-coded versions in haxe still make sense. Update the static version references. 
    # 3. copy the previous docs e.g: `docs/pages/previous_versions/api_0.1.34.md`
    # 4. edit libs/test/test.js (add the versions)
    # 4. add the previous version in the testing framework, see test metapage/frame, `docs/_data/lib_versions.yml`
    # 5. make publish-new-version <the exact version> #https://docs.npmjs.com/cli/version.html

    # Deprecate: `npm deprecate metapage@0.1.36`



