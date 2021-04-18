# When applying this terragrunt config in an `xxx-all` command, make sure the modules at "../vpc" and "../rds" are
# handled first.
dependencies {
  paths = ["../project"]
}

inputs = {
  project_id          = local.env_vars.project_id
  image               = run_cmd("just", "image")
  fqdn                = get_env("FQDN")
  oauth_client_id     = local.secrets.oauth_client_id
  oauth_client_secret = local.secrets.oauth_client_secret
}

terraform {
  source = "${get_env("ROOT", "/repo")}/.cloudseed/cloud/lib/terraform/app/gcp/vouch//cloud-run"
}

include {
  path = find_in_parent_folders("terragrunt.config.hcl")
}

locals {
  env_vars = jsondecode(file(find_in_parent_folders("locals.json")))
  secrets = jsondecode(sops_decrypt_file("${get_terragrunt_dir()}/secrets.encrypted.json"))
}
