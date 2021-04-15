# CI: github

Automated build|test|deploy via github actions.

## Required for Google Cloud Platform deployments via Github Actions

Two secrets (change `github.com/<owner>/<repo>` URL path to match your own repository):

`Actions secrets`: https://github.com/metapages/cloudseed/settings/secrets/actions
  - `GOOGLE_APPLICATION_CREDENTIALS_CONTENT` from the content in `.provider/gcp/terraform-admin.json`
    - If the file doesn't exist: `just provider gcp initialize` (you may have to `just cloud` first)
  - `PERSONAL_ACCESS_TOKEN` with the value from https://github.com/settings/tokens
    - https://docs.github.com/en/free-pro-team@latest/packages/guides/migrating-to-github-container-registry-for-docker-images#authenticating-with-the-container-registry
    - Unfortunately a PAT is needed to:
      - authenticate to `ghcr.io` (but not to `docker.pkg.github.com`)
      - trigger a deploy from an automated tag
    - Requires permissions: `write:packages`
      - ❗ If are using any of the `tag*` workflows (e.g. `.cloudseed/github/workflows/tag-master@myapp.com.yml` in `.github/workflows`)
        - You also need the `repo` scope, and this is a security risk (see link above)
        - Unfortunately the `repo` scope is needed to trigger a deploy from an automated tag
