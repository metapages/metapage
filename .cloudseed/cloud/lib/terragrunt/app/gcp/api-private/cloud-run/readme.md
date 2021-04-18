# Debugging

Automatically mapping domain names to cloud runs is beta and buggy and poorly documented.

Example overview (in a deployment):

    just api-public/apply

That creates the `cloud-run` resource, then links our custom domain (e.g. `app.com`>).

Then you need to run (with the replaced parameters):

    gcloud beta run --platform managed --project test2-magickwand-io-3ri7 --region us-central1 domain-mappings describe --domain test2.magickwand.io --format json | jq .

The `resourceRecords` key has the exact DNS record you need to add at your domain register.

E.g.:

```
    "resourceRecords": [
      {
        "name": "test2",
        "rrdata": "ghs.googlehosted.com.",
        "type": "CNAME"
      }
    ]
```

https://cloud.google.com/run/docs/mapping-custom-domains#dns_update




### List domain mappings

The console doesn't show all information, you need to use `gcloud` instead: https://stackoverflow.com/questions/57789565/google-cloud-run-domain-mapping-stuck-at-certificate-provisioning?rq=1

e.g.

    gcloud beta --project test2-magickwand-io-3ri7 --region us-central1 run --platform managed domain-mappings list --format json | jq .

    gcloud beta run --platform managed --project test2-magickwand-io-3ri7 --region us-central1 domain-mappings describe --domain test2.magickwand.io --format json | jq .
