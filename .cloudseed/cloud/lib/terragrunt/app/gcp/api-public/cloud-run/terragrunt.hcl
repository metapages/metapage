# When applying this terragrunt config in an `xxx-all` command, make sure the modules at "../vpc" and "../rds" are
# handled first.
# dependencies {
#   # paths = ["../project", "../vouch", "../graphql"]
#   # paths = ["../project", "../vouch"]
#   paths = []
# }

dependency "project" {
  config_path = "../project"
  mock_outputs = {}
}

dependency "vouch" {
  config_path = "../vouch"
  mock_outputs = {
    url = "fake"
  }
}

dependency "graphql" {
  config_path = "../graphql"
  mock_outputs = {
    url = "fake"
  }
}

inputs = {
  project_id                  = local.env_vars.project_id
  image                       = run_cmd("just", "image")
  ingress                     = "domain-mapping"
  fqdn                        = get_env("FQDN")
  hasura_graphql_admin_secret = local.secrets_graphql.hasura_graphql_admin_secret
  hasura_graphql_origin       = dependency.graphql.outputs.url
  origin_vouch_internal       = dependency.vouch.outputs.url
}

terraform {
  source = "${get_env("ROOT", "/repo")}/.cloudseed/cloud/lib/terraform/app/gcp/api-public//cloud-run"
}

include {
  path = find_in_parent_folders("terragrunt.config.hcl")
}

locals {
  env_vars = jsondecode(file(find_in_parent_folders("locals.json")))
  secrets_graphql = jsondecode(sops_decrypt_file("${get_parent_terragrunt_dir()}/graphql/secrets.encrypted.json"))
}
