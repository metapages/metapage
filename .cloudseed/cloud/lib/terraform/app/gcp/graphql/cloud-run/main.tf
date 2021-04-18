# About cloud run: https://github.com/ahmetb/cloud-run-faq
# terraform gcp cloud run service. it's nice.
# https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/cloud_run_service
# Example showing this setup: https://dev.to/davidoliveira/setup-hasura-at-google-cloud-run-42i8
# Warning: hasura isn't the best fit for cloud run: websockets and reacting to db events won't work.

variable "project_id" {
  type = string
}

variable "region" {
  type = string
  default = "us-central1"
}

variable "image" {
  type = string
}

variable "hasura_graphql_admin_secret" {
  type = string
}

variable "hasura_graphql_hooks" {
  type = string
}

variable "sql_user_password" {
  type = string
}

variable "sql_proxy_connection" {
  type = string
  default = null
}

variable "sql_private_ip_address" {
  type = string
}

variable "vpc_access_connector_id" {
  type = string
}

variable "fqdn" {
  type = string
}

variable "api_key" {
  type = string
}

# Return service URL
output "url" {
  value = google_cloud_run_service.default.status[0].url
}

locals {
  ######################################################################
  # the fields below manage the logic of where the required cloud-sql
  # service is running
  ######################################################################
  # https://dev.to/davidoliveira/setup-hasura-at-google-cloud-run-42i8
  # And here is the little detail in HASURA_GRAPHQL_DATABASE_URL that does
  # the magic of not needing to embed the Cloud SQL Proxy into the container,
  # look to the host variable as a querystring parameter:
  db_url_public = "postgres://graphql:${var.sql_user_password}@/graphql?host=/cloudsql/${var.sql_proxy_connection}"
  db_url_vpc = "postgres://graphql:${var.sql_user_password}@${var.sql_private_ip_address}:5432/graphql"
  db_url = var.sql_private_ip_address != "" ? local.db_url_vpc : local.db_url_public
  annotation_sql_private_ip = {
      # https://cloud.google.com/run/docs/configuring/connecting-vpc#yaml
      # Instead of connecting via the sql_proxy_connection it appears you need a vpc-access-connector
      "run.googleapis.com/vpc-access-connector" = var.vpc_access_connector_id
  }
  annotation_sql_public_ip = {
      # Next three from
      # https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/cloud_run_service#example-usage---cloud-run-service-sql
      "autoscaling.knative.dev/maxScale"      = "1000"
      "run.googleapis.com/cloudsql-instances" = var.sql_proxy_connection
      "run.googleapis.com/client-name"        = "terraform"
  }
}

# Deploy image to Cloud Run
# https://cloud.google.com/run/docs/reference/container-contract
resource "google_cloud_run_service" "default" {
  project = var.project_id
  name     = "graphql"
  location = var.region

  template {
    spec {
      containers {
        image = var.image
        env {
          name = "HASURA_GRAPHQL_DATABASE_URL"
          value = local.db_url
        }
        env {
          name = "HASURA_GRAPHQL_SERVER_PORT"
          value = "8080"
        }
        env {
          name = "HASURA_GRAPHQL_ADMIN_SECRET"
          value = var.hasura_graphql_admin_secret
        }
        env {
          name = "HASURA_GRAPHQL_AUTH_HOOK"
          value = "${var.hasura_graphql_hooks}/auth"
        }
        env {
          name = "HASURA_GRAPHQL_HOOKS"
          value = var.hasura_graphql_hooks
        }
        env {
          name = "HOOKS_API_KEY"
          value = var.api_key
        }

        resources {
          limits = {
            memory = "2G"
          }
        }
      }
    }

    metadata {
      annotations = var.sql_private_ip_address != "" ? local.annotation_sql_private_ip : local.annotation_sql_public_ip
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  autogenerate_revision_name = true
}

# Create public access
data "google_iam_policy" "noauth" {
  binding {
    role = "roles/run.invoker"
    members = [
      "allUsers",
    ]
  }
}

# Enable public access on Cloud Run service
resource "google_cloud_run_service_iam_policy" "noauth" {
  location    = google_cloud_run_service.default.location
  project     = google_cloud_run_service.default.project
  service     = google_cloud_run_service.default.name
  policy_data = data.google_iam_policy.noauth.policy_data
}
