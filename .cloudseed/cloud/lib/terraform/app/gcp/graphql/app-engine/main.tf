# This blog shows how to connect cloud run to a private cloud-sql instance:
# https://dev.to/davidoliveira/setup-hasura-at-google-cloud-run-42i8
# THIS DOES NOT WORK YET, INCOMPLETE

variable "project_id" {
  type = string
}

variable "project_number" {
  type = string
}

variable "location" {
  type = string
}

variable "location_short" {
  type = string
}

variable "image" {
  type = string
}

variable "db_url" {
  type = string
}

variable "hasura_graphql_admin_secret" {
  type = string
}

variable "hasura_graphql_auth_hook" {
  type = string
}

variable "network" {
  type = string
}

variable "subnetwork" {
  type = string
}

output "id" {
  value = google_app_engine_flexible_app_version.myapp_v1.id
}

output "name" {
  value = google_app_engine_flexible_app_version.myapp_v1.name
}

output "url" {
  value = "https://${var.project_id}.${var.location_short}.r.appspot.com"
}

resource "google_app_engine_application" "app" {
  project     = var.project_id
  location_id = var.location
}

resource "google_project_service" "service" {
  project = var.project_id
  service = "appengineflex.googleapis.com"

  disable_dependent_services = false
}

resource "google_project_iam_member" "gae_api" {
  project = var.project_id
  role    = "roles/compute.networkUser"
  member  = "serviceAccount:service-${var.project_number}@gae-api-prod.google.com.iam.gserviceaccount.com"
}

resource "google_app_engine_flexible_app_version" "myapp_v1" {
  version_id = "v1"
  project    = google_project_iam_member.gae_api.project
  service    = "default"
  runtime    = "custom"
  # env        = "flex"

  # entrypoint {
  #   --server-port
  #   shell = "node ./app.js"
  # }

  deployment {
    container {
      image = var.image
    }
  }

  liveness_check {
    path = "/v1/version"
  }

  readiness_check {
    path = "/v1/version"
  }

  # https://hasura.io/docs/1.0/graphql/core/deployment/graphql-engine-flags/reference.html#server-flag-reference
  env_variables = {
    port                        = 8080
    HASURA_GRAPHQL_DATABASE_URL = var.db_url
    HASURA_GRAPHQL_ADMIN_SECRET = var.hasura_graphql_admin_secret
    HASURA_GRAPHQL_AUTH_HOOK    = ""
  }

  network {
    # Google Compute Engine network where the virtual machines are created. Specify the short name, not the resource path.
    name       = var.network
    subnetwork = var.subnetwork
  }



  # handlers {
  #   url_regex        = ".*\\/my-path\\/*"
  #   security_level   = "SECURE_ALWAYS"
  #   login            = "LOGIN_REQUIRED"
  #   auth_fail_action = "AUTH_FAIL_ACTION_REDIRECT"

  #   static_files {
  #     path = "my-other-path"
  #     upload_path_regex = ".*\\/my-path\\/*"
  #   }
  # }

  automatic_scaling {
    cool_down_period = "120s"
    cpu_utilization {
      target_utilization = 0.5
    }
  }

  noop_on_destroy = true
}

# resource "google_storage_bucket" "bucket" {
#   project = google_project.my_project.project_id
#   name = "appengine-static-content"
# }

# resource "google_storage_bucket_object" "object" {
#   name   = "hello-world.zip"
#   bucket = google_storage_bucket.bucket.name
#   source = "./test-fixtures/appengine/hello-world.zip"
# }
