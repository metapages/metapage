# This is just an empty placeholder resource
# You don't always need a VPC. For production systems you probably want one
# but for development it's quicker and cheaper to not use one.
# Not using a VPC:
#  - cloud-sql instances have a public IP
#  - pay less 💰 since you don't need a vpc-connector (and ingress?)

terraform {
  source = "${get_env("ROOT", "/repo")}/.cloudseed/cloud/lib/terraform/app/gcp/vpc//none"
}
