locals {
  master_user = "master_user"
}

variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "network" {
  type = string
}

variable "master_user_password" {
  type = string
}

output "master_private_ip_address" {
  value = module.postgres.master_private_ip_address
}

output "master_instance_name" {
  value = module.postgres.master_instance_name
}

output "master_ip_addresses" {
  value = module.postgres.master_ip_addresses
}

output "master_proxy_connection" {
  value = module.postgres.master_proxy_connection
}

output "db" {
  value = module.postgres.db
}

output "db_name" {
  value = module.postgres.db_name
}

output "complete" {
  value = module.postgres.complete
}

output "master_user" {
  value = local.master_user
}

########################################################
# SQL database
# https://cloud.google.com/sql/docs/mysql/connect-kubernetes-engine
########################################################

# resource "null_resource" "iam_db" {
#   provisioner "local-exec" {
#     # command = "echo ${length([google_project_service.servicenetworking.project, google_project_service.compute.project, google_project_service.sql_component.project, google_project_service.sqladmin.project, google_project_iam_member.cloudsql_admin.project, google_project_service.container.project, google_project_service.deploymentmanager.project, google_project_service.container_admin.project])}"
#     command = "echo ${length([google_project_service.servicenetworking.project, google_project_service.compute.project, google_project_service.sql_component.project, google_project_service.sqladmin.project, google_project_iam_member.cloudsql_admin.project])}"
#   }
# }






# #######################################################
# SQL IAM
# #######################################################


# MAYBE This service is needed to create sql instances
# resource "google_project_iam_member" "cloudsql_admin" {
#   project = "${google_project.project.project_id}"
#   role    = "roles/cloudsql.admin"
#   member  = "serviceAccount:terraform@transition9-terraform-admin.iam.gserviceaccount.com"
# }


# This service is needed to create the sql network connection
resource "google_project_service" "servicenetworking" {
  project = var.project_id
  service = "servicenetworking.googleapis.com"
}

# MAYBE This service is needed to create sql instances
# resource "google_project_service" "sql_component" {
#   project = "${google_project.project.project_id}"
#   service = "sql-component.googleapis.com"
# }

# # MAYBE This service is needed to create sql instances
# resource "google_project_service" "sqladmin" {
#   project = "${google_project.project.project_id}"
#   service = "sqladmin.googleapis.com"
# }



########################################################
# SQL network bits
########################################################

# Reserve global internal address range for the peering between the private sql instance and other stuff in the vpc
resource "google_compute_global_address" "private_ip_address" {
  # provider      = google-beta
  project       = var.project_id
  name          = "${var.project_id}-private-ip-01"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = var.network
}

# Establish VPC network peering connection using the reserved address range (between the private sql and the vpc network)
resource "google_service_networking_connection" "private_vpc_connection" {
  depends_on              = [google_compute_global_address.private_ip_address]
  # provider                = google-beta
  network                 = var.network
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address.name]
}

########################################################
# CREATE DATABASE INSTANCE WITH PRIVATE IP
########################################################

module "postgres" {
  # When using these modules in your own templates, you will need to use a Git URL with a ref attribute that pins you
  # to a specific version of the modules, such as the following example:
  source = "github.com/gruntwork-io/terraform-google-sql.git//modules/cloud-sql?ref=v0.3.0"

  # deletion_protection = false

  project     = var.project_id
  region      = var.region
  master_zone = "${var.region}-a"

  name    = "db-001"
  # We have to add this for the module, but each application might have their own database in the instance
  db_name = "default"

  engine       = "POSTGRES_9_6"
  machine_type = "db-f1-micro"

  # These together will construct the master_user privileges, i.e.
  # 'master_user_name'@'master_user_host' IDENTIFIED BY 'master_user_password'.
  # These should typically be set as the environment variable TF_VAR_master_user_password, etc.
  # so you don't check these into source control."
  master_user_password = var.master_user_password

  master_user_name = local.master_user
  master_user_host = "%"

  # Pass the private network link to the module
  # This has to be initialized and apply'ed to completion before setting this up
  private_network = var.network

  # Wait for the vpc connection to complete
  # dependencies = [local.network]

  custom_labels = {
    env = "replaceme"
  }
}
