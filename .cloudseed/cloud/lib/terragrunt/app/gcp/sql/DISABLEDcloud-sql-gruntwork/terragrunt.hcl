dependencies {
  paths = ["../project", "../vpc"]
}

# dependency "vpc" {
#   config_path = "../vpc"
# }

inputs = {
  project_id              = local.env_vars.locals.project_id
  region                  = local.env_vars.locals.region
  # network                 = dependency.vpc.outputs.network
  master_user_password    = local.secrets.master_password
}

terraform {
  source = "${get_env("ROOT", "/repo")}/cloud/lib/terraform/app/gcp/sql//cloud-sql-gruntwork"
}

include {
  path = find_in_parent_folders("terragrunt.config.hcl")
}

locals {
  env_vars = read_terragrunt_config(find_in_parent_folders("locals.hcl"))
  secrets = jsondecode(sops_decrypt_file("secrets.encrypted.json"))
}
