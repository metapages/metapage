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

# Publish new npm module version (defined in lib/package.json)
publish:
    just lib/publish
    just worker/deploy

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
