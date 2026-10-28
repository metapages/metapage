# just docs: https://github.com/casey/just

# Very high-level root-repository operations
# More specific commands are in deeper justfiles
#  - Commands containing 🌱 in the docs are (or will be) used for automation and are required to link to docs explaining further if needed

set shell       := ["bash", "-c"]
set dotenv-load := true
# TODO: bold doesn't work, and it used to. What happened?
bold               := '\033[1m'
normal             := '\033[0m'
green              := "\\e[32m"
yellow             := "\\e[33m"
blue               := "\\e[34m"
magenta            := "\\e[35m"
grey               := "\\e[90m"

_help:
    #!/usr/bin/env bash
    just --list --unsorted --list-heading $'🚪 Commands for {{green}}https://github.com/metapages/metapage{{normal}}:\n\n'
    echo -e ""
    echo -e "       🔽 {{bold}}Sub-commands: ( just <command> ){{normal}}"
    echo -e "           worker {{blue}}#worker commands{{normal}}"
    echo -e "           lib    {{blue}}#library(module) commands{{normal}}"

# Build the application stack
@build +args="":
    # The worker builds the js module too
    just worker/build

# Run all build/unit/functional tests
test:
    just lib/test
    just worker/test

# The tag is the trigger: this pushes vX.Y.Z, which runs
# .github/workflows/publish.yml, which tests, publishes to npm with provenance,
# and cuts the GitHub release. Nothing here publishes anything itself, so a
# release that fails in CI is re-run from the Actions tab, not re-tagged.
#
#   just release          # next patch version
#   just release 1.11.0   # that exact version
#
# RELEASE_YES=1 skips the confirmation prompt.

# 🌱 Cut a release: bump lib/package.json, roll the changelog, tag and push
release version="":
    #!/usr/bin/env bash
    set -euo pipefail

    NPM_MODULE="$(jq -r .name lib/package.json)"
    CURRENT="$(jq -r .version lib/package.json)"

    # ---- work out the new version before touching anything -----------------
    if [ -n "{{ version }}" ]; then
        VERSION="{{ version }}"
        # Leading v is a natural typo; accept it rather than cutting v-v1.2.3.
        VERSION="${VERSION#v}"
        if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]]; then
            echo "💥 '$VERSION' is not a semver version (X.Y.Z[-pre])"
            exit 1
        fi
    elif [[ "$CURRENT" == *-* ]]; then
        # npm's `patch` semantics: a patch bump off a prerelease is the release
        # it was a prerelease of, not the version after it.
        VERSION="${CURRENT%%-*}"
    else
        IFS=. read -r MAJOR MINOR PATCH <<< "$CURRENT"
        VERSION="$MAJOR.$MINOR.$((PATCH + 1))"
    fi
    TAG="v$VERSION"

    # ---- preflight ---------------------------------------------------------
    # Every one of these is a way to cut a tag that publishes something other
    # than what you think you are publishing. Fail before the push, not after:
    # a pushed tag has already started the publish, and npm versions are
    # forever.
    BRANCH="$(git rev-parse --abbrev-ref HEAD)"
    if [ "$BRANCH" != "main" ]; then
        echo "💥 releases are cut from main, not '$BRANCH'"
        exit 1
    fi

    if ! git diff --quiet HEAD --; then
        echo "💥 uncommitted changes - the release commit must contain only the version bump"
        git status --short
        exit 1
    fi

    git fetch --quiet --tags origin main
    if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
        echo "💥 main and origin/main disagree: $(git rev-list --left-right --count HEAD...origin/main | tr '\t' '/') (ahead/behind)"
        echo "👉 push or pull first, so the tag lands on a commit that exists on the remote"
        exit 1
    fi

    if git rev-parse -q --verify "refs/tags/$TAG" > /dev/null; then
        echo "💥 tag $TAG already exists locally"
        exit 1
    fi
    if [ -n "$(git ls-remote --tags origin "$TAG")" ]; then
        echo "💥 tag $TAG already exists on origin"
        exit 1
    fi

    # The registry is the only authority on what has shipped. Catches the case
    # the tags cannot: a version published without a tag.
    if npm view "$NPM_MODULE@$VERSION" version > /dev/null 2>&1; then
        echo "💥 $NPM_MODULE@$VERSION is already on npm - pick a higher version"
        exit 1
    fi

    # ---- confirm -----------------------------------------------------------
    echo -e "📦 {{ bold }}$NPM_MODULE $CURRENT → $VERSION{{ normal }}  (tag $TAG on $(git rev-parse --short HEAD))"
    echo ""
    NOTES="$(just _changelog-section Unreleased)"
    if [ -n "$NOTES" ]; then
        echo "$NOTES" | sed 's/^/    /'
    else
        echo -e "    {{ yellow }}changelog [Unreleased] is empty - the release notes will be generated from commits{{ normal }}"
    fi
    echo ""
    if [ -t 0 ] && [ "${RELEASE_YES:-}" != "1" ]; then
        read -r -p "Cut and push $TAG? This publishes to npm. [y/N] " REPLY
        case "$REPLY" in
            y | Y) ;;
            *)
                echo "🚪 nothing done"
                exit 1
                ;;
        esac
    fi

    # ---- bump --------------------------------------------------------------
    # --no-git-tag-version: the tag is cut below, over a commit that also
    # carries the changelog and README edits. npm would tag the bump alone.
    ( cd lib && npm version "$VERSION" --no-git-tag-version > /dev/null )
    just lib/update-docs-versions

    if [ -n "$NOTES" ]; then
        # Open a fresh [Unreleased] above the version being cut, so the next
        # change has somewhere to go and `publish.yml` can find these notes
        # under their version number.
        VERSION="$VERSION" DATE="$(date -u +%Y-%m-%d)" perl -0pi \
            -e 's/^## \[Unreleased\]\n/## [Unreleased]\n\n## [$ENV{VERSION}] - $ENV{DATE}\n/m' \
            changelog.md
    fi

    git add -A
    git commit --quiet -m "release $TAG"

    # Annotated, so the tag carries the release notes and an author. The
    # GitHub release reads the changelog, not this, but `git show $TAG` and
    # `git describe` are better for it.
    if [ -n "$NOTES" ]; then
        printf '%s\n\n%s\n' "$TAG" "$NOTES" | git tag -a "$TAG" -F -
    else
        git tag -a "$TAG" -m "$TAG"
    fi

    # Commit first: if this races with someone else's push, the tag was never
    # pushed and nothing has been published. The reverse order publishes a tag
    # pointing at a commit nobody else has.
    git push --quiet origin main
    git push --quiet origin "$TAG"

    echo -e "✅ {{ green }}pushed $TAG{{ normal }}"
    echo -e "   👀 https://github.com/metapages/metapage/actions/workflows/publish.yml"

# `_changelog-section Unreleased`, `_changelog-section 1.10.16`

# Print one section of the changelog, without its heading
_changelog-section version:
    #!/usr/bin/env bash
    set -euo pipefail
    # Blank lines are held back rather than printed, so the leading and
    # trailing ones around a section disappear while the ones between its
    # subsections survive. No `tac`: it is GNU-only, and this runs on macOS.
    awk -v want="{{ version }}" '
        index($0, "## [" want "]") == 1 { found = 1; next }
        found && /^## \[/ { exit }
        found && /^[[:space:]]*$/ { if (started) pending++; next }
        found {
            while (pending-- > 0) print ""
            pending = 0
            started = 1
            print
        }
    ' changelog.md

# This is what publish.yml runs once a tag is pushed. It only publishes the
# version already in lib/package.json, and is a no-op if that version shipped.
# To cut a release, use `just release`.

# Publish lib/package.json's current version to npm (CI entry point)
publish:
    just lib/publish

# Run the worker
@dev:
    just worker/dev

# Quick compile check
@check:
    just lib/check
    just worker/check

@fmt +failIfChanged="":
    just lib/fmt {{failIfChanged}}

# Deletes generated files
@clean:
    just lib/clean
    just worker/clean

###################################################
# Internal utilies
###################################################

alias worker := _worker
@_worker +args="":
    just worker/{{args}}

alias lib := _lib
@_lib +args="":
    just lib/{{args}}

###################################################
# pr-daemon 🌱 http://localhost:7377/setup
#
# One preview stack per branch: the production Fresh build of ./worker,
# served by `deno serve` on a port derived from the branch name. The app is
# entirely origin-relative (no baked-in URLs, CORS reflects the request
# origin) and `deno serve` does not validate Host headers, so the same stack
# works unchanged behind pr-daemon's public preview proxy. Nothing to wire,
# and no PR_DAEMON_ROUTE lines: the browser only ever calls this one origin.
###################################################

# 🌱 pr-daemon: start this branch's preview stack, print its local URL
pr-daemon-up:
    #!/usr/bin/env bash
    set -euo pipefail
    # Everything but the final URL goes to stderr: pr-daemon reads the URL off
    # the last stdout line that is nothing but a URL.
    exec 3>&1 1>&2
    BRANCH="$(git rev-parse --abbrev-ref HEAD)"
    # Deterministic per-branch port, so `up` and `down` agree without any
    # shared state and two branches' stacks never collide. cksum, not md5:
    # it is POSIX and spelled the same on macOS and Linux.
    PORT=$(( 20000 + $(printf '%s' "$BRANCH" | cksum | cut -d' ' -f1) % 20000 ))
    STATE=".pr-daemon"
    echo "🌱 branch=$BRANCH port=$PORT"

    # Stop before building, never after: `down` runs `just clean`, which
    # deletes exactly the build output a fresh `up` needs.
    just pr-daemon-down
    mkdir -p "$STATE"

    # Then build, then start. `deno serve` loads _fresh/server.js once at
    # startup, so a server left running would keep serving the old build:
    # re-running `up` after a code change has to replace the process, or the
    # agent never sees its own edits. The build is ~10s, cheap enough to
    # always redo.
    just lib/build
    just worker/build

    cd worker
    # nohup + closed stdin + detached: no TTY here, and the process has to
    # outlive this recipe's shell.
    #
    # 3>&- matters as much as the rest. pr-daemon reads this recipe's stdout
    # through a pipe, and fd 3 is a dup of it; a long-lived child holding that
    # fd open means the reader never sees EOF and `up` appears to hang
    # forever, even though it has already printed the URL and exited.
    nohup deno serve -A --port "$PORT" _fresh/server.js \
        > "../$STATE/server.log" 2>&1 < /dev/null 3>&- &
    echo $! > "../$STATE/server.pid"
    cd ..

    # Return only once the app actually answers.
    for i in $(seq 1 120); do
        CODE="$(curl -s -o /dev/null -w '%{http_code}' -m 3 "http://127.0.0.1:$PORT/" || true)"
        case "$CODE" in
            2*|3*) echo "✅ preview up on port $PORT after ${i}s"; echo "http://localhost:$PORT" >&3; exit 0 ;;
        esac
        sleep 1
    done

    echo "💥 preview did not answer on port $PORT within 120s"
    cat "$STATE/server.log" || true
    exit 1

# 🌱 pr-daemon: stop this branch's preview stack and delete its data
pr-daemon-down:
    #!/usr/bin/env bash
    set -euo pipefail
    # Safe to run when nothing is up.
    BRANCH="$(git rev-parse --abbrev-ref HEAD)"
    PORT=$(( 20000 + $(printf '%s' "$BRANCH" | cksum | cut -d' ' -f1) % 20000 ))
    STATE=".pr-daemon"

    if [ -f "$STATE/server.pid" ]; then
        PID="$(cat "$STATE/server.pid")"
        if kill -0 "$PID" 2>/dev/null; then
            kill "$PID" 2>/dev/null || true
            for _ in $(seq 1 20); do
                kill -0 "$PID" 2>/dev/null || break
                sleep 0.5
            done
            kill -9 "$PID" 2>/dev/null || true
        fi
        rm -f "$STATE/server.pid"
    fi

    # Belt and braces: a pidfile lost to a crash would otherwise leave the
    # port held, and this branch's port is ours alone to reclaim.
    pkill -f "deno serve -A --port $PORT _fresh/server.js" 2>/dev/null || true

    # Delete the branch's data: there are no containers or volumes, only
    # generated build output.
    just clean
    rm -rf "$STATE"
    echo "✅ preview down (branch=$BRANCH port=$PORT)"

# Matches what CI gates on branches, minus `just worker/test`: that one is a
# ~100s browser E2E on a hardcoded port (8762), so two previews checking at the
# same time would collide. CI stays the outer gate for it.

# 🌱 pr-daemon: must be green before a PR opens
pr-daemon-check:
    just lib/fmt-check
    just check
    just lib/test
