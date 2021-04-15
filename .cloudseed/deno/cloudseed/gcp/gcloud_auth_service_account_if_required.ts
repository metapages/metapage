/**
 * Check who is currently authenticated to gcloud, and login with the
 * cloudseed GCE service account if needed
 */

import { getArgsFromEnvAndCli } from "../../env/mod.ts";
import { run } from "../../exec/mod.ts";
import { getGCloudTerraformAccount } from "../mod.ts";

export const activateServiceAccount = async () => {
    const output: { account: string, status: string }[] = await run('gcloud auth list --format json').silent().pipeJson();

    const email = await getGCloudTerraformAccount();

    const active = output.find(a => a.status === "ACTIVE");
    // cloudseed-terraform-admin defined in cloud/lib/provider/gcp/justfile
    if (!active || active.account !== email) {
        const { GOOGLE_APPLICATION_CREDENTIALS } = getArgsFromEnvAndCli({ GOOGLE_APPLICATION_CREDENTIALS: true });
        const result = await run(`gcloud auth activate-service-account --format json --key-file=${GOOGLE_APPLICATION_CREDENTIALS}`).silent().pipeString();
    }
}

if (import.meta.main) {
    await activateServiceAccount();
}
