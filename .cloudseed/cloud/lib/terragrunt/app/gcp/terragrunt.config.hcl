# This is the actual config, will parameterize later

# Created by 'just cloud/lib/provider/gcp/initialize'
# Configuration shared by all deployments
# Document the shit out of this with breadcrumbs and links

locals {
  env_vars = jsondecode(file(find_in_parent_folders("locals.json")))
  service_account = jsondecode(file(get_env("GOOGLE_APPLICATION_CREDENTIALS")))
}

remote_state {
    backend = "gcs"
    generate = {
        path      = "backend.tf"
        if_exists = "overwrite_terragrunt"
    }
    config = {
        # TODO: gcs buckets are globally unique so it may require suffixing with date or random hash
        # These values are generated from the github repository name
        bucket      = "${local.service_account.project_id}"
        project     = "${local.service_account.project_id}"
        prefix      = "${local.env_vars.project_id}/${path_relative_to_include()}/terraform.tfstate"
        credentials = get_env("GOOGLE_APPLICATION_CREDENTIALS")
    }
}

# There are problem with the plugin cache and terragrunt *all commands: https://github.com/gruntwork-io/terragrunt/issues/1212
terraform {
  extra_arguments "init" {
    commands = ["init"]

    arguments = [
      "-get-plugins=false",
      # "-plugin-dir=${get_env("TERRAFORM_PLUGIN_DIR")}",
      # "-plugin-dir=${get_env("TF_PLUGIN_CACHE_DIR")}",
    ]
  }
}


# IMPORTANT:
# Due to a bug https://github.com/gruntwork-io/terragrunt/issues/1212
# to properly seed the providers so that they are properly cached during the docker image build step
# this generate block is COPIED to /repo/cloud/lib/terragrunt/terragrunt.hcl
# and the terragrunt init called on it (this file contains too many contextual dependencies
# to use directly)
# Version constraint docs: https://www.terraform.io/docs/configuration/version-constraints.html#version-constraint-syntax
generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite_terragrunt"
  contents  = <<EOF
terraform {
  required_version = "${get_env("VERSION_TERRAFORM")}"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "<= ${get_env("VERSION_TERRAFORM_GOOGLE")}"
    }

    google-beta = {
      source  = "hashicorp/google-beta"
      version = "<= ${get_env("VERSION_TERRAFORM_GOOGLE_BETA")}"
    }

    null = {
      source  = "hashicorp/null"
      version = "${get_env("VERSION_TERRAFORM_NULL")}"
    }

    random = {
      source  = "hashicorp/random"
      version = "${get_env("VERSION_TERRAFORM_RANDOM")}"
    }

    template = {
      source  = "hashicorp/template"
      version = "${get_env("VERSION_TERRAFORM_TEMPLATE")}"
    }
  }
}

EOF
}
