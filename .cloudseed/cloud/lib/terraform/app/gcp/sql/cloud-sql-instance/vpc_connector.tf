###############################################################
# 💰 this resource costs: only created if sql inside
# VPC and cloud-run services require access
# The vpc-connector is managed by the sql service, but only
# because there are no other services (yet) that could conflict
# in how this should be managed, so placing the vpc-connector
# with cloud-sql until otherwise needed
###############################################################

locals {
  vpc_access_connector_enable = var.network == "" ? false : true
}

output "vpc_access_connector_id" {
  value = (local.vpc_access_connector_enable ? google_vpc_access_connector.required_by_cloud_run[0].id : "")
}

output "vpc_access_connector_state" {
  value = (local.vpc_access_connector_enable ? google_vpc_access_connector.required_by_cloud_run[0].state : "")
}

# Required for the cloud-sql proxy https://cloud.google.com/sql/docs/mysql/sql-proxy#permissions
resource "google_project_service" "vpcaccess" {
  count                      = local.vpc_access_connector_enable ? 1 : 0
  service                    = "vpcaccess.googleapis.com"
  project                    = var.project_id
  disable_dependent_services = true
}

# cloud-run services that need VPC access need a google_vpc_access_connector
# this service costs 💰: https://cloud.google.com/vpc/docs/configure-serverless-vpc-access#connectors
# approx $9/month by my skim reading
# https://cloud.google.com/vpc/docs/configure-serverless-vpc-access#creating_a_connector
resource "google_vpc_access_connector" "required_by_cloud_run" {
  count         = local.vpc_access_connector_enable ? 1 : 0
  project       = var.project_id
  name          = "requiredbycloudrun"
  region        = var.region
  ip_cidr_range = "10.8.0.0/28"
  network       = var.network
  depends_on    = [google_project_service.vpcaccess]

}
