# dependencies {
#   paths = ["../project"]
# }

dependency "project" {
  config_path = "../project"
  skip_outputs = true
}

inputs = {
  project_id                  = local.env_vars.project_id
  image                       = run_cmd("just", "image")
  fqdn                        = get_env("FQDN")
  hasura_graphql_admin_secret = local.secrets_graphql.hasura_graphql_admin_secret
  hasura_graphql_origin       = "https://graphql.${get_env("FQDN")}"
  # API key to restrict access (only graphql has it)
  api_key                     = local.secrets.key
}

terraform {
  source = "${get_env("ROOT", "/repo")}/.cloudseed/cloud/lib/terraform/app/gcp/api-private//cloud-run"
}

include {
  path = find_in_parent_folders("terragrunt.config.hcl")
}

locals {
  env_vars = jsondecode(file(find_in_parent_folders("locals.json")))
  secrets_graphql = jsondecode(sops_decrypt_file("${get_parent_terragrunt_dir()}/graphql/secrets.encrypted.json"))
  secrets = jsondecode(sops_decrypt_file("${get_terragrunt_dir()}/secrets.encrypted.json"))
}
