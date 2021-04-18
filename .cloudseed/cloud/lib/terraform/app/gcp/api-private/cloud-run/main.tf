# terraform gcp cloud run service. it's nice.
# https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/cloud_run_service

variable "project_id" {
  type = string
}

variable "image" {
  type = string
}

variable "region" {
  type = string
  default = "us-central1"
}

variable "fqdn" {
  type = string
}

variable "hasura_graphql_admin_secret" {
  type = string
}

variable "hasura_graphql_origin" {
  type = string
}

variable "api_key" {
  type = string
}

# Return service URL
output "url" {
  value = google_cloud_run_service.default.status[0].url
}

# output "service_account_id" {
#   value = google_service_account.default.id
# }

# output "service_account_email" {
#   value = google_service_account.default.email
# }
# output "service_account_name" {
#   value = google_service_account.default.name
# }

# restricting access requires the google_cloud_run_service to
# use a new google_service_account
# resource "google_service_account" "default" {
#   project      = var.project_id
#   account_id   = "api-cloud-run"
#   display_name = "cloudseed api service account"
# }

# Deploy image to Cloud Run
# https://cloud.google.com/run/docs/reference/container-contract
resource "google_cloud_run_service" "default" {
  project = var.project_id
  name     = "api-private"
  location = var.region

  metadata {
    namespace = var.project_id
  }

  template {
    spec {
      # the service account is required for restricted access
      # service_account_name = google_service_account.default.name
      containers {
        image = var.image
        env {
          name = "HASURA_GRAPHQL_ADMIN_SECRET"
          value = var.hasura_graphql_admin_secret
        }
        env {
          name = "HASURA_GRAPHQL_ORIGIN"
          value = var.hasura_graphql_origin
        }
        env {
          name = "APP_FQDN"
          value = var.fqdn
        }
        env {
          name = "API_KEY"
          value = var.api_key
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
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
