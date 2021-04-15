/**
 * Check who is currently authenticated to gcloud, and login with the
 * cloudseed GCE service account if needed
 */

import * as Colors from "https://deno.land/std/fmt/colors.ts ";
import { run } from "../../exec/mod.ts";
import { getGCloudTerraformProjectId, isGCloudTerraformAccount } from "../mod.ts";

const PAD_SIZE = 57;

const output: { account: string, status: string }[] = await run('gcloud auth list --format json').silent().pipeJson();

const isServiceAccount = await isGCloudTerraformAccount();

let projectName :string|undefined;

if (isServiceAccount) {
    projectName = await getGCloudTerraformProjectId();
}

const active = output.find(a => a.status === "ACTIVE");
if (!active || (projectName && active.account === `cloudseed-terraform-admin@${projectName}.iam.gserviceaccount.com`)) {
    console.log('🚪 🔥 No root account authenticated. Attempting to authenticate to gcloud: 🚪');
    await run(`gcloud auth login`).printCommand().pipeString();
} else {
    console.log(`🚪 👍 ${Colors.bold(active.account)}`.padEnd(PAD_SIZE) +  `already using root account (for creating the terraform service account 🚪`);
}
