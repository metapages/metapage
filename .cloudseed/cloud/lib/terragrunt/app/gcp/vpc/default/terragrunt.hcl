inputs = {
  project_id = local.env_vars.project_id
  region     = local.env_vars.region
  # enabled if sql is in the VPC (no public IP which is the default)
  # TODO: make this not hard-coded by figuring out in create.ts
  vpc_access_connector_enable = true
}

terraform {
  source = "${get_env("ROOT", "/repo")}/.cloudseed/cloud/lib/terraform/app/gcp/vpc//default"
}

include {
  path = find_in_parent_folders("terragrunt.config.hcl")
}

locals {
  env_vars = jsondecode(file(find_in_parent_folders("locals.json")))
}
