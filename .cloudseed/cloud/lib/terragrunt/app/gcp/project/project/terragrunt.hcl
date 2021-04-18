inputs = {
  project_id      = local.env_vars.project_id
  billing_account = local.organization.billing_account
  organization_id = local.organization.organization_id
  owner_email     = local.organization.owner_email
}

terraform {
  source = "${get_env("ROOT", "/repo")}/.cloudseed/cloud/lib/terraform/app/gcp//project"
}

include {
  path = find_in_parent_folders("terragrunt.config.hcl")
}

locals {
  env_vars = jsondecode(file(find_in_parent_folders("locals.json")))
  organization = jsondecode(sops_decrypt_file(get_env("GOOGLE_ORGANIZATION_JSON")))
}
