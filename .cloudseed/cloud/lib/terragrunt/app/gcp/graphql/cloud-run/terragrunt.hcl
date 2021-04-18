# Reference for the sql connection: https://dev.to/davidoliveira/setup-hasura-at-google-cloud-run-42i8

dependency "project" {
  config_path = "../project"
  mock_outputs = {}
}

dependency "sql" {
  config_path = "../sql"
  mock_outputs = {
    name = "fake"
    proxy_connection_name = "fake"
    private_ip_address = "100.0.0.1"
    vpc_access_connector_id = "fake"
  }
}

dependency "api_private" {
  config_path = "../api-private"
  mock_outputs = {
    url = "fake"
  }
}

inputs = {
  project_id                  = local.env_vars.project_id
  region                      = local.env_vars.region
  image                       = run_cmd("just", "image")
  fqdn                        = "graphql.${get_env("FQDN")}"
  ingress                     = local.env_vars.resources.ingress.type

  sql_user_password           = local.sql_secrets.master_password
  sql_instance_name           = dependency.sql.outputs.name
  sql_proxy_connection        = dependency.sql.outputs.proxy_connection_name
  sql_private_ip_address      = dependency.sql.outputs.private_ip_address
  # Required to access sql in a private VPC network
  vpc_access_connector_id     = dependency.sql.outputs.vpc_access_connector_id

  # hasura specific
  hasura_graphql_admin_secret = local.secrets.hasura_graphql_admin_secret
  hasura_graphql_hooks        = "${dependency.api_private.outputs.url}/hook"
  # required to authenticate to the api webhooks
  api_key                     = local.api_secrets.key
}

terraform {
  source = "${get_env("ROOT", "/repo")}/.cloudseed/cloud/lib/terraform/app/gcp/graphql//cloud-run"
}

include {
  path = find_in_parent_folders("terragrunt.config.hcl")
}

locals {
  env_vars = jsondecode(file(find_in_parent_folders("locals.json")))
  secrets = jsondecode(sops_decrypt_file("${get_terragrunt_dir()}/secrets.encrypted.json"))
  sql_secrets = jsondecode(sops_decrypt_file("${get_terragrunt_dir()}/../sql/secrets.encrypted.json"))
  api_secrets = jsondecode(sops_decrypt_file("${get_terragrunt_dir()}/../api-private/secrets.encrypted.json"))
}
