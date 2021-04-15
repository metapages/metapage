import { getGCloudTerraformProjectId } from "./mod.ts";

export const getTerraformAdminServiceAccount = async () => {
    const gcpTerraformProjectName = await getGCloudTerraformProjectId();
    return `cloudseed-terraform-admin@${gcpTerraformProjectName}.iam.gserviceaccount.com`;
}
