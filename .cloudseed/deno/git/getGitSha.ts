/**
 * Print the git SHA (if you can find it out) to stdout
 * Arguments:
 *   --short=<count> (default 8 if set)
 * The universal env var key for this value is DOCKER_TAG
 * So if that value is found in the env vars, just use it
 */

import { parse } from "https://deno.land/std/flags/mod.ts";
import { getGitSha } from "./mod.ts";

const CLI_ARGS = parse(Deno.args);
let short: number = 0;

if (Deno.env.get('DOCKER_TAG')) {
    console.log(Deno.env.get('DOCKER_TAG'));
    Deno.exit(0);
}

if (CLI_ARGS['short']) {
    if (typeof (CLI_ARGS['short']) === 'boolean') {
        //default to 8
        short = 8;
    } else {
        short = parseInt(CLI_ARGS['short']);
    }
}

const sha = await getGitSha({ short });
console.log(sha);
