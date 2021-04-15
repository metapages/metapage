/**
 * CLI tool to create a new (or update an existing) terraform (terragrunt) configuration
 * for a deployment of the app.
 */

import { getDeployments, DEPLOYMENTS_ROOT } from "./mod.ts";
import { run } from "../exec/run.ts";

const deployments = getDeployments();

// currently github only
const GITHUB_REF = Deno.env.get('GITHUB_REF');

if (!GITHUB_REF || GITHUB_REF === '') {
    console.log('No GITHUB_REF specified, no deploy actions taken');
    Deno.exit(0);
}

let target = GITHUB_REF.split('/')[2];

if (!target) {
    throw `No target found in GITHUB_REF=${target}`;
}

if (!target.startsWith('@')) {
    console.log(`Tag or branch ${target} does not start with the character: "@", therefore not considered a deployment`);
    Deno.exit(0);
}

target = target.substr(1); // remove the '@'

console.log('target', target);
console.log('deployments', deployments);

if (deployments.includes(target)) {
    console.log(`🚀 targeted for deployment: ${target}`);
    const result = await run(`just ${DEPLOYMENTS_ROOT}/${target}/gcp/apply`)
     .withEnv(Deno.env.toObject())
     .printCommand()
     .pipeString();
}

// watchexec --watch /repo/.cloudseed/ -- GITHUB_REF="refs/tags/@test4.magickwand.io" deno run --allow-all /repo/.cloudseed/deno/cloudseed/tag_deploy_github.ts
