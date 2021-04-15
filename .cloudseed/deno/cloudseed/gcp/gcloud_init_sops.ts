/**
 * Check who is currently authenticated to gcloud, and login with the
 * cloudseed GCE service account if needed
 */

import { run } from "../../exec/mod.ts";
import { getGCloudTerraformProjectId, getGCloudTerraformAccount } from "../mod.ts";
import { activateServiceAccount } from "./mod.ts";

await activateServiceAccount();

const TERRAFORM_PROJECT_NAME = await getGCloudTerraformProjectId();
const TERRAFORM_ADMIN_ACCOUNT = await getGCloudTerraformAccount();

const KEYRING = 'sops';
const KEYNAME = 'sops-key';

const FULL_SOPS_KEYRING = `projects/${TERRAFORM_PROJECT_NAME}/locations/global/keyRings/${KEYRING}`;
const FULL_SOPS_KEY = `projects/${TERRAFORM_PROJECT_NAME}/locations/global/keyRings/${KEYRING}/cryptoKeys/${KEYNAME}`;

// check if the keyring exists
const outputKeyringList: { createTime: string, name: string }[] = await run(`gcloud kms keyrings list --location global --project ${TERRAFORM_PROJECT_NAME} --format json`).silent().pipeJson();
if (!outputKeyringList.some((val: { createTime: string, name: string }) => val.name === FULL_SOPS_KEYRING)) {
    await run(`gcloud kms keyrings create ${KEYRING} --location global`).printCommand().pipeString();
}

// check if the key exists
const outputKeysList: { createTime: string, name: string }[] = await run(`gcloud kms keys list --format json --location global --keyring ${KEYRING} --project ${TERRAFORM_PROJECT_NAME} --format json`).silent().pipeJson();
if (!outputKeysList.some((val: { createTime: string, name: string }) => val.name === FULL_SOPS_KEY)) {
    // create the key
    await run(`gcloud kms keys create ${KEYNAME} --location global --keyring ${KEYRING} --purpose encryption`).printCommand().pipeString();
    // add the IAM policy so the terraform service account can encrypt/decrypt with the key
    await run(`gcloud kms keys add-iam-policy-binding ${FULL_SOPS_KEY} --member serviceAccount:${TERRAFORM_ADMIN_ACCOUNT} --role roles/cloudkms.cryptoKeyEncrypterDecrypter --location global --keyring ${KEYRING}`).printCommand().pipeString();
}
