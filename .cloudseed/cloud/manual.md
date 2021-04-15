# Cloud deployment

Deploy this application, from scratch, in at least one place. We will guide you through each step.

  - [Tasks](#tasks)
    - [First steps](#first-steps)

## Tasks

### First steps (initialization and setup)

#### Sign up to the cloud provider, get access keys, add to repo

This is a work in progress, since it's not clear to me yet how exactly keys+kops works.

- `aws`: https://portal.aws.amazon.com/billing/signup#/start
  - Create a free account
  - Signin: https://signin.aws.amazon.com/signin
    - `IAM`: https://console.aws.amazon.com/iam/home?region=us-east-2#/home
      - Activate MFA on your root account
      - Create a new user (name=`CI`)
        - Allow `Access type`: ✅ `Programmatic access`
        - `Next: Permissions`
        - Attach existing policies directly
          - ✅`AdministratorAccess`
        - `Next: Tags`
        - `Next: Review`
        - `Create user`
        - Copy `Access key ID` and `Secret access key` add them to `</cloud>.env`:
          - ```
            AWS_ACCESS_KEY_ID=xxx
            AWS_SECRET_ACCESS_KEY=xxx
            ```
#### Create KMS keys

TODO

KMS is keys in the cloud, safely locking secrets in the repository, and unlocking them elsewhere.


### Set up CI


TODO

Automates build->test->publish

#### Github Actions
