
Developing:

    make run

Then compile with host `haxe build*.hxml` or `webpack`

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
    # 2. copy the previous docs e.g: `docs/pages/previous_versions/api_0.1.34.md`
    # 3. add the previous version in the testing framework, see test metapage/frame
    # 4. make publish-new-version <the exact version> #https://docs.npmjs.com/cli/version.html



