
## Developing:

    make run

Then compile with:

    make shell-haxe
    make compile

Updating jekyll gems:

    # Add gem to Gemfile
    make jekyll-shell
    cd docs && bundle install

## Publishing:

    version-new-publish

Then after the npm version is published:

    just _post-version-new-publish

Things to check for (that is not yet, or difficult, to automate)
    # 1. ensure the version is good in haxe. change haxe versions rarely, these correspond to major API versions
    # 2. ensure any hard-coded versions in haxe still make sense. Update the static version references. 
