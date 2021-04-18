# This is just to initialize the plugins
# There are problem with the plugin cache and terragrunt *all commands: https://github.com/gruntwork-io/terragrunt/issues/1212
# So we generate the plugin cache ahead of time and reference the generated /cloudseed/provider.tf file in our deployments
terraform {
  extra_arguments "init_args" {
    commands = [
      "init"
    ]

    arguments = [
      "-get-plugins=false",
      # "-plugin-dir=${get_env("TF_PLUGIN_CACHE_DIR")}",
    ]
  }
}

# IMPORTANT:
# See "generate" block note in /repo/cloud/lib/terragrunt/app/gcp/terragrunt.config.hcl
generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite_terragrunt"
  contents  = <<EOF
terraform {
  required_version = "${get_env("VERSION_TERRAFORM")}"
}

provider "google" {
  version = "${get_env("VERSION_TERRAFORM_GOOGLE")}"
}

provider "google-beta" {
  version = "${get_env("VERSION_TERRAFORM_GOOGLE_BETA")}"
}

provider "null" {
  version = "${get_env("VERSION_TERRAFORM_NULL")}"
}

provider "random" {
  version = "${get_env("VERSION_TERRAFORM_RANDOM")}"
}

provider "template" {
  version = "${get_env("VERSION_TERRAFORM_TEMPLATE")}"
}

EOF
}
