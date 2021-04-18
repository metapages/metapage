########################################################
# CREATE A NETWORK TO DEPLOY THE CLUSTER TO
########################################################

variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

locals {
  prefix = "app"
  name   = "${local.prefix}-network"
}

output "name" {
  value = local.name
}

output "network" {
  value = module.vpc_network.network
}
output "public_subnetwork" {
  value = module.vpc_network.public_subnetwork
}
output "public_subnetwork_name" {
  value = module.vpc_network.public_subnetwork_name
}

output "public_subnetwork_cidr_block" {
  value = module.vpc_network.public_subnetwork_cidr_block
}
output "private_subnetwork" {
  value = module.vpc_network.private_subnetwork
}
output "private_subnetwork_name" {
  value = module.vpc_network.private_subnetwork_name
}
output "private_subnetwork_cidr_block" {
  value = module.vpc_network.private_subnetwork_cidr_block
}

output "private_subnetwork_gateway" {
  value = module.vpc_network.private_subnetwork_gateway
}
output "private_subnetwork_secondary_cidr_block" {
  value = module.vpc_network.private_subnetwork_secondary_cidr_block
}

output "private_subnetwork_secondary_range_name" {
  value = module.vpc_network.private_subnetwork_secondary_range_name
}

module "vpc_network" {
  source = "github.com/gruntwork-io/terraform-google-network.git//modules/vpc-network?ref=v0.6.0"

  name_prefix = local.prefix
  project     = var.project_id
  region      = var.region

  # cidr_block           = var.vpc_cidr_block
  # secondary_cidr_block = var.vpc_secondary_cidr_block
}
