# https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/google_project
# Sets up minimal needed for a gcp project that will deploy an application

variable "project_id" {
  type = string
}

variable "billing_account" {
  type = string
}

variable "organization_id" {
  type = string
}

variable "owner_email" {
  type = string
}

output "project_id" {
  value = google_project.project.project_id
}

output "project_number" {
  value = google_project.project.number
}

output "project_name" {
  value = google_project.project.name
}

resource "google_project" "project" {
  name            = var.project_id
  project_id      = var.project_id
  billing_account = var.billing_account
  org_id          = var.organization_id
}

resource "google_project_service" "compute" {
  service    = "compute.googleapis.com"
  project    = google_project.project.project_id
  depends_on = [google_project.project]
}

resource "google_project_service" "container_registry" {
  service    = "containerregistry.googleapis.com"
  project    = google_project.project.project_id
  depends_on = [google_project.project]
  disable_dependent_services = true
}

resource "google_project_service" "cloud_run" {
  service    = "run.googleapis.com"
  project    = google_project.project.project_id
  depends_on = [google_project.project]
}

# Required for the cloud-sql proxy https://cloud.google.com/sql/docs/mysql/sql-proxy#permissions
resource "google_project_service" "sqladmin" {
  service    = "sqladmin.googleapis.com"
  project    = google_project.project.project_id
  depends_on = [google_project.project]
  disable_dependent_services = true
}

# the sql/cloud-sql-instance resource requires servicenetworking
resource "google_project_service" "servicenetworking" {
  service    = "servicenetworking.googleapis.com"
  project    = google_project.project.project_id
  # https://github.com/hashicorp/terraform-provider-google/issues/2129
  provisioner "local-exec" {
    command = "sleep 30"
  }
  depends_on = [google_project.project]
}

# This role allows ME to see the project in the browser using the admin@transition9.com account
resource "google_project_iam_member" "allow_root_account_visibility" {
  project = google_project.project.project_id
  role    = "roles/owner"
  member  = "user:${var.owner_email}"
}
