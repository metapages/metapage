# just docs: https://github.com/casey/just

help:
    @just --list

# Run the stack, defaulting to all. Just target "jekyll" for a minimal server
run +TARGET='jekyll builder-haxe test metapage-app':
    docker-compose up --remove-orphans {{TARGET}}

# Builds the npm libraries. Requires 'just run builder-haxe'
build:
    docker-compose exec builder-haxe webpack

# https://docs.npmjs.com/cli/version.html
# npm version, git tag, and push to release a new version and publish docs
version-new-publish VERSION='patch' downtimeok='yes' dirtyok='yes':
    @# Fail if uncomitted changes
    if [ "{{dirtyok}}" != "yes" ]; then git diff-index --quiet HEAD --; fi
    @# actually bump the libs version. BUT do not commit or tag, since we need to update some jekyll references before committing
    @# this commmit will be picked up by the build process and the npm libraries published
    cd libs && npm --no-git-tag-version version {{VERSION}}
    if [ "{{downtimeok}}" == "yes" ]; then just version-update-local-files; fi
    just version-commit
    git push --follow-tags
    @# i cannot remember why i need this step, it *is* important, fill in later why
    rm -rf build
    @echo "version `just version` pushed and queued for publishing (via cloudbuild.yml)"    

version-help:
    @echo "New version release steps"
    @echo "1. just publish-new-version"
    @echo "2. Wait until libs are published"
    @echo "3. `just versions-update`"


# Idempotent version update where they are used
version-update-local-files:
    docker-compose run builder-haxe just _versions-write-versions-to-jekyll

# Get current NPM version
version:
    cat libs/package.json | jq -r '.version'

# Commit the current staged/unstaged commits with the current libs/package.json version
version-commit:
    git add -u ; git commit -m "v`just version`"
    git tag v`just version`

# Damn it happens 
version-remove VERSION:
    git push origin :v{{VERSION}} || :
    git tag -d :v{{VERSION}} || :
    npm deprecate metapage@{{VERSION}} "Deprecating via automated version-remove" || :
    npm deprecate metaframe@{{VERSION}} "Deprecating via automated version-remove" || :
    @echo "If this version should be ignored in tests, add to libs/test/versions.js versions = versions.filter((v) => {"