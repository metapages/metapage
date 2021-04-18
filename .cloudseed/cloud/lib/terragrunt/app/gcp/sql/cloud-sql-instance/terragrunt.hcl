dependency "project" {
  config_path = "../project"
  mock_outputs = {}
}

dependency "vpc" {
  config_path = "../vpc"
  mock_outputs = {
    network = "fake"
  }
}

inputs = {
  project_id              = local.env_vars.project_id
  region                  = local.env_vars.region
  graphql_user_password   = local.secrets.master_password
  # if you provide a network ( network = dependency.vpc.outputs.network ):
  #   - then cloud-sql gets a private IP (default is public 😢)
  #   - cloud-run services connect to cloud-sql via vpc-access-connector (costs 💰)
  # else (no network given):
  #   - then the sql instance gets a public IP
  #   - cloud-run services connect to cloud-sql via the proxy connection
  #       - the proxy connection is automatically created
  # NB: cloud-run services will configure themselves automatically based on
  #     downstream outputs from this setting. In other words, change this and other services will automatically adjust
  network                 = local.env_vars.resources.vpc.type != "none" ? dependency.vpc.outputs.network : ""
}

terraform {
  source = "${get_env("ROOT", "/repo")}/.cloudseed/cloud/lib/terraform/app/gcp/sql//cloud-sql-instance"
}

include {
  path = find_in_parent_folders("terragrunt.config.hcl")
}

locals {
  env_vars = jsondecode(file(find_in_parent_folders("locals.json")))
  secrets = jsondecode(sops_decrypt_file("${get_terragrunt_dir()}/secrets.encrypted.json"))
}
