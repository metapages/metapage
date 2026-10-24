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
# pr-daemon (http://localhost:7377/setup)
###################################################
# pr-daemon drives each branch's preview stack through three commands, run as
# `bash -lc` from the root of the branch's worktree with no TTY:
#   up    — print the local URL as the LAST line of stdout, return only once the
#           app answers, be idempotent, isolate per branch, never open a browser
#   down  — stop this branch's services and delete its data; safe when not up
#   check — must be green before a PR opens
# The stack is the worker (module.metapage.io) serving this branch's lib build.

# Start this branch's worker dev server in the background and print its URL
pr-daemon-up:
    #!/usr/bin/env bash
    set -euo pipefail
    # stdout is reserved for the URL: everything else goes to stderr
    exec 3>&1 1>&2
    cd "{{ justfile_directory() }}"
    branch=$(git rev-parse --abbrev-ref HEAD)
    state="$PWD/.pr-daemon"
    pidfile="$state/dev.pid"
    portfile="$state/dev.port"
    hostfile="$state/dev.host"
    logfile="$state/dev.log"
    mkdir -p "$state"
    # Set by pr-daemon when it proxies a public preview host to this server
    public_host="${PR_DAEMON_PUBLIC_HOST:-}"

    answers() { curl -fs -o /dev/null -m 3 "http://localhost:$1/"; }
    listening() { lsof -ti "tcp:$1" -sTCP:LISTEN >/dev/null 2>&1; }

    # Idempotent: already serving for the same public host
    if [ -f "$portfile" ] && answers "$(cat "$portfile")" \
        && [ "$(cat "$hostfile" 2>/dev/null)" = "$public_host" ]; then
        echo "pr-daemon-up: $branch already serving on port $(cat "$portfile")"
        echo "http://localhost:$(cat "$portfile")" >&3
        exit 0
    fi
    if [ -f "$pidfile" ]; then
        just pr-daemon-down
        mkdir -p "$state"
    fi

    # Port derived from the branch name so branches never collide
    base=$(( 8100 + $(printf '%s' "$branch" | cksum | cut -d' ' -f1) % 700 ))
    port=$base
    for _ in $(seq 1 100); do
        listening "$port" || break
        port=$(( port + 1 ))
    done
    if listening "$port"; then
        echo "pr-daemon-up: no free port near $base"
        exit 1
    fi

    # The worker serves the lib build from this branch
    just lib/build
    (cd worker && deno install)

    # Fully detached: pr-daemon reads stdout to EOF
    (cd worker && APP_PORT="$port" PR_DAEMON_PUBLIC_HOST="$public_host" \
        nohup deno task dev >"$logfile" 2>&1 < /dev/null &
     echo $! > "$pidfile")
    echo "$port" > "$portfile"
    printf '%s' "$public_host" > "$hostfile"

    for _ in $(seq 1 180); do
        if answers "$port"; then
            echo "pr-daemon-up: $branch up on port $port (log: $logfile)"
            echo "http://localhost:$port" >&3
            exit 0
        fi
        if ! kill -0 "$(cat "$pidfile")" 2>/dev/null; then
            echo "pr-daemon-up: dev server exited; last 40 lines:"
            tail -40 "$logfile"
            exit 1
        fi
        sleep 1
    done
    echo "pr-daemon-up: timed out waiting for http://localhost:$port; last 40 lines:"
    tail -40 "$logfile"
    exit 1

# Stop this branch's worker dev server and delete what it generated
pr-daemon-down:
    #!/usr/bin/env bash
    set -euo pipefail
    cd "{{ justfile_directory() }}"
    state=".pr-daemon"
    if [ -f "$state/dev.pid" ]; then
        pid=$(cat "$state/dev.pid")
        kill "$pid" 2>/dev/null || true
        for _ in $(seq 1 20); do
            kill -0 "$pid" 2>/dev/null || break
            sleep 0.5
        done
        kill -9 "$pid" 2>/dev/null || true
    fi
    # `deno task dev` spawns vite as a child: reap whatever still holds the port
    port=$(cat "$state/dev.port" 2>/dev/null || true)
    if [ -n "$port" ]; then
        for p in $(lsof -ti "tcp:$port" -sTCP:LISTEN 2>/dev/null); do
            kill -9 "$p" 2>/dev/null || true
        done
    fi
    rm -rf "$state" worker/_fresh
    echo "pr-daemon-down: stopped and cleaned"

# Must be green before a PR opens: formatting, type checks, lib tests
pr-daemon-check:
    cd lib && (test -d node_modules || npm i) && npx prettier --check .
    # --noEmit, not `just check`: `tsc --build` writes into lib/dist and would
    # replace the bundle a running preview serves from /lib
    just lib/_tsc --noEmit
    just worker/check
    just lib/test
