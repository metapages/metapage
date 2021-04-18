# Reference for the sql connection: https://dev.to/davidoliveira/setup-hasura-at-google-cloud-run-42i8

# When applying this terragrunt config in an `xxx-all` command, make sure the modules at "../vpc" and "../rds" are
# handled first.
dependencies {
  paths = ["../project", "../api-private", "../sql"]
}

dependency "project" {
  config_path = "../project"
}

dependency "sql" {
  config_path = "../sql"
}

dependency "api_private" {
  config_path = "../api-private"
}

inputs = {
  project_id                  = local.env_vars.project_id
  region                      = local.env_vars.region
  image                       = run_cmd("just", "image")
  fqdn                        = "graphql.${get_env("FQDN")}"
  # currently this module only understands ingress=[load-balancer|domain-mapping] so ensure
  # only those two values are possible
  ingress                     = local.env_vars.services.ingress == "load-balancer" ? local.env_vars.services.ingress : "domain-mapping"

  sql_user_password           = local.sql_secrets.master_password
  sql_instance_name           = dependency.sql.outputs.name
  sql_proxy_connection        = dependency.sql.outputs.proxy_connection_name
  sql_private_ip_address      = dependency.sql.outputs.private_ip_address
  # Required to access sql in a private VPC network
  vpc_access_connector_id     = dependency.sql.outputs.vpc_access_connector_id

  # hasura specific
  hasura_graphql_admin_secret = local.secrets.hasura_graphql_admin_secret
  hasura_graphql_auth_hook    = "${dependency.api_private.outputs.url}/hook/auth"
  hasura_graphql_event_hook   = "${dependency.api_private.outputs.url}/hook/event"
  hasura_graphql_action_hook  = "${dependency.api_private.outputs.url}/hook/action"
}

terraform {
  source = "${get_env("ROOT", "/repo")}/.cloudseed/cloud/lib/terraform/app/gcp/graphql//cloud-run"
}

include {
  path = find_in_parent_folders("terragrunt.config.hcl")
}

locals {
  env_vars    = jsondecode(file(find_in_parent_folders("locals.json")))
  sql_secrets = jsondecode(sops_decrypt_file("${get_terragrunt_dir()}/../sql/secrets.encrypted.json"))
  secrets     = jsondecode(sops_decrypt_file("${get_terragrunt_dir()}/secrets.encrypted.json"))
}
