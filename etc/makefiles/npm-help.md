
NPM tasks:

    bump version: `npm version patch`
    publish: `make npm-publish`
    google cloud set NPM token:
        printf <token> | gcloud kms encrypt \
          --plaintext-file=- \
          --ciphertext-file=- \
          --location=global \
          --project=t9-docker-images \
          --keyring=t9_cloud_build \
          --key=cloud_build_key_github_token | base64

