/**
 * Print the docker registry (if you can find it out) to stdout
 */

import {exec, OutputMode } from "../mod.ts";
import { parse } from "https://deno.land/std/flags/mod.ts";

const CLI_ARGS = parse(Deno.args);
const APPENDED_SLASH = CLI_ARGS['append-slash'] ? '/' : '';

// Is this running in Github Actions? Then the repository name is the env var is e.g. GITHUB_REPOSITORY=octocat/Hello-World
// https://docs.github.com/en/actions/configuring-and-managing-workflows/using-environment-variables
if (Deno.env.get('GITHUB_ACTIONS') === 'true' && Deno.env.get('GITHUB_REPOSITORY')) {
    console.log(Deno.env.get('GITHUB_REPOSITORY') + APPENDED_SLASH);
} else {
    const result = await exec('git config --get remote.origin.url', {output:OutputMode.Capture, continueOnError:false, printCommand:false, env:Deno.env.toObject()});
    if (!result.status.success) {
        console.error(result.output);
        Deno.exit(result.status.code);
    }
    // results.output = e.g. git@github.com:myname/myrepo.git
    console.log(result.output.split(':')[1].replace('.git', '') + APPENDED_SLASH)
}
