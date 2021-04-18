variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

# private network id
variable "network" {
  type = string
  default = ""
}

output "name" {
  value = google_sql_database_instance.instance.name
}

output "ip_address" {
  value = google_sql_database_instance.instance.ip_address.0.ip_address
}

output "private_ip_address" {
  value = google_sql_database_instance.instance.private_ip_address
}

output "self_link" {
  value = google_sql_database_instance.instance.self_link
}

output "proxy_connection_name" {
  value = google_sql_database_instance.instance.connection_name
}

resource "google_compute_global_address" "private_ip_address" {
  count         = var.network == "" ? 0 : 1
  provider      = google-beta
  project       = var.project_id

  name          = "private-ip-address"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = var.network
}

resource "google_service_networking_connection" "private_vpc_connection" {
  count                   = var.network == "" ? 0 : 1
  provider                = google-beta
  network                 = var.network
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address[0].name]
}

resource "random_id" "instance_name_suffix" {
  byte_length = 4
}

resource "google_sql_database_instance" "instance" {
  provider = google-beta
  project  = var.project_id
  database_version = "POSTGRES_11"

  name     = "private-instance-${random_id.instance_name_suffix.hex}"
  region   = var.region

  # while debugging, destroy this easily
  deletion_protection = false

  depends_on = [google_service_networking_connection.private_vpc_connection]

  settings {
    tier = "db-f1-micro"
    ip_configuration {
      ipv4_enabled    = var.network == "" ? true : false
      private_network = var.network == "" ? "" : var.network
    }
  }

  lifecycle {
    ignore_changes = [
      # This is only here because terraform keeps modifying the resource and setting this value over and over
      settings.0.replication_type,
    ]
  }
}
