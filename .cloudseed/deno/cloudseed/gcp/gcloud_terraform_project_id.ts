/**
 * Check who is currently authenticated to gcloud, and login with the
 * cloudseed GCE service account if needed
 */

import Random from "https://deno.land/x/random@v1.1.2/Random.js";
import { getArgsFromEnvAndCli } from "../../env/mod.ts";
import { getRepositoryName } from "../mod.ts";

export const getGCloudTerraformProjectId = async (): Promise<string> => {
    const { GOOGLE_APPLICATION_CREDENTIALS } = getArgsFromEnvAndCli({ GOOGLE_APPLICATION_CREDENTIALS: true });
    let projectName: string | undefined;
    try {
        const text = await Deno.readTextFile(GOOGLE_APPLICATION_CREDENTIALS);
        const projectBlob: { project_id: string } = JSON.parse(text);
        projectName = projectBlob.project_id;
    } catch (err) {
        console.log(`🚪 🔥 missing or cannot parse: ${GOOGLE_APPLICATION_CREDENTIALS} 🚪`);
        console.log(`🚪 ➡ Have you run: 'just initialize'? 🚪`);
        throw err;
    }
    return projectName;
}

export const getGCloudTerraformAccount = async (): Promise<string> => {
    const { GOOGLE_APPLICATION_CREDENTIALS } = getArgsFromEnvAndCli({ GOOGLE_APPLICATION_CREDENTIALS: true });
    let client_email: string | undefined;
    try {
        const text = await Deno.readTextFile(GOOGLE_APPLICATION_CREDENTIALS);
        const projectBlob: { client_email: string } = JSON.parse(text);
        client_email = projectBlob.client_email;
    } catch (err) {
        console.log(`🚪 🔥 missing or cannot parse: ${GOOGLE_APPLICATION_CREDENTIALS} 🚪`);
        console.log(`🚪 ➡ Have you run: 'just initialize'? 🚪`);
        throw err;
    }
    return client_email;
}

export const isGCloudTerraformAccount = async (): Promise<boolean> => {
    const { GOOGLE_APPLICATION_CREDENTIALS } = getArgsFromEnvAndCli({ GOOGLE_APPLICATION_CREDENTIALS: true });
    try {
        const text = await Deno.readTextFile(GOOGLE_APPLICATION_CREDENTIALS);
        JSON.parse(text);
        return true;
    } catch (err) {
        return false;
    }
}

export const createGCloudTerraformProjectId = async (): Promise<string> => {
    const r = new Random();
    const name = await getRepositoryName();
    return `${name.replace('/', '-').replace('.', '')}-${r.string(4)}`;
}

if (import.meta.main) {
    const name = await createGCloudTerraformProjectId();
    console.log(name);
}
