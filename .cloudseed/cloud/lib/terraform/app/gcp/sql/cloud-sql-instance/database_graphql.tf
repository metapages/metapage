# Provide the cloud-sql details, and provide a database URL for connections

locals {
  graphql_database_name = "graphql"
  graphql_user          = "graphql"
  # db_url         = var.sql_private_ip_address == "" ? "postgres://${local.db_master_user}:${var.master_user_password}@/${local.db_name}?host=/cloudsql/${var.sql_proxy_connection}" : "postgres://${local.db_master_user}:${var.master_user_password}@${var.sql_private_ip_address}:5432/${local.db_name}"
}

variable "graphql_user_password" {
  type = string
}

# variable "sql_instance_name" {
#   type = string
# }

# variable "sql_proxy_connection" {
#   type = string
# }

# variable "sql_private_ip_address" {
#   type = string
# }

output "google_sql_database_graphql_id" {
  value = google_sql_database.graphql.id
}

output "google_sql_database_graphql_user" {
  value = google_sql_user.graphql_user.name
}

resource "google_sql_database" "graphql" {
  project  = var.project_id
  instance = google_sql_database_instance.instance.name
  name     = local.graphql_database_name
}

resource "google_sql_user" "graphql_user" {
  project  = var.project_id
  instance = google_sql_database_instance.instance.name
  name     = local.graphql_user
  password = var.graphql_user_password
}
