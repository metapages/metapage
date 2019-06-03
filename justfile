# just docs: https://github.com/casey/just

help:
    @just --list
    @echo "{{HELP}}"

# Run the stack, defaulting to all. Just target "jekyll" for a minimal server  metapage-app
run +TARGET='jekyll proxy builder-haxe test':
    docker-compose up --remove-orphans {{TARGET}}

# Builds the npm libraries. Requires 'just run builder-haxe'
build:
    docker-compose exec builder-haxe webpack

# https://docs.npmjs.com/cli/version.html
# npm version, git tag, and push to release a new version and publish docs
version-new-publish VERSION='patch' dirtyok='yes':
    @# Fail if uncomitted changes
    if [ "{{dirtyok}}" != "yes" ]; then git diff-index --quiet HEAD --; fi
    @# actually bump the libs version. # disabled --no-git-tag-version version because the ordering screwed up the cloud tests
    cd libs && npm version {{VERSION}}
    @# this commmit will be picked up by the build process and the npm libraries published
    git add -u ; git commit -m "v`just version`" && git tag v`just version` && git push && git push origin v`just version`
    @# i cannot remember why i need this step, it *is* important, fill in later why
    @rm -rf libs/build
    @echo "version `just version` pushed and queued for publishing (via cloudbuild.yml)"
    @echo "IMPORTANT: run 'just _post-version-new-publish' because jekyll needs to know about the new version, and this cannot happen in an automated way because if forked the cloud tests"

_post-version-new-publish:
    just version-update-local-files
    just version-commit

version-help:
    @echo "New version release steps"
    @echo "1. just publish-new-version"
    @echo "2. Wait until libs are published"
    @echo "3. just _post-version-new-publish"

# Idempotent version update where they are used
version-update-local-files:
    docker-compose run builder-haxe just _versions-write-versions-to-jekyll
    git add -u ; git commit -m "DOCS: Updating current library to version: `just version`" && git push
    @# i cannot remember why i need this step, it *is* important, fill in later why
    @rm -rf libs/build

# Get current NPM version
version:
    cat libs/package.json | jq -r '.version'

# Damn it happens. Untagging/deprecating, and some possible manual tweaks.
version-remove VERSION:
    @if [[ {{VERSION}} == v* ]]; then echo "version must not start with the v" && exit 1; fi
    git push origin :v{{VERSION}} || :
    git tag -d v{{VERSION}} || :
    npm deprecate metapage@{{VERSION}} "Deprecating via automated version-remove" || :
    npm deprecate metaframe@{{VERSION}} "Deprecating via automated version-remove" || :
    @echo "If this version should be ignored in tests, add to libs/test/versions.js versions = versions.filter((v) => {"
    @echo "package.json: adjust accordingly, you might have to manually decrement or change the version"

########################################
# DEPRECATED

# Commit the current staged/unstaged commits with the current libs/package.json version
_DEPRECATED_version-commit:
    git add -u ; git commit -m "v`just version`"
    git tag v`just version`

HELP := '
Reminders:
  Developing app.metapages.org locally? Modify docs/_data/urls.yml
'