# Reference for the sql connection: https://dev.to/davidoliveira/setup-hasura-at-google-cloud-run-42i8

# When applying this terragrunt config in an `xxx-all` command, make sure the modules at "../vpc" and "../rds" are
# handled first.
dependencies {
  paths = ["../project", "../api-public"]
}

dependency "project" {
  config_path = "../project"
}

dependency "api-public" {
  config_path = "../api-public"
}

inputs = {
  project_id                  = local.env_vars.project_id
  region                      = local.env_vars.region
  fqdn                        = get_env("FQDN")
}

terraform {
  source = "${get_env("ROOT", "/repo")}/cloud/lib/terraform/app/gcp/ingress//load-balancer"
}

include {
  path = find_in_parent_folders("terragrunt.config.hcl")
}

locals {
  env_vars = jsondecode(file(find_in_parent_folders("locals.json")))
}
