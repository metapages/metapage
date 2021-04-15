# cloudseed Manual

`cloudseed` is a git repository _template_ for creating web application/API/services and publishing them to the cloud.

After copying/forking this repository, add your own application, and with as few steps as possible:

Build your app, put the keys in the ignition, and drive it into the cloud.

## [Merging/forking](#merging-forking)

1. Fork the `cloudseed` repo.
   - Or add the remote: `git remote add cloudseed git@github.com:metapages/cloudseed.git`
2. Work on your own fork
3. `cloudseed` gets updated, and you want those updates:

  git fetch cloudseed
  git merge cloudseed/master

You'll likely need to make edits for the merge to work.



**Common Tasks:**

Host computer minimal prerequisites are:

- [just](https://github.com/casey/just#installation)
- [docker](https://docs.docker.com/get-docker/).
- [deno](https://deno.land/#installation)

Others may be needed depending on the operations, but you will be notified by the tools themselves.

**Tasks:**

- local stack (just the app/ directory):
  - run: `just app/dev`: starts the **local** app in the background and opens a browser pointing to the app
  - test: `just test`
  - build: `just build`
- ci (automation):
  - test: `just test` (aliases `just ci/test`)
    - ☝also can be called locally
  - publish: `just publish` (aliases `just ci/publish`)
    - ☝also can be called locally
- cloud:
  - [initialization](#cloud-initialization)
  - deploy/update service with target images:
    - `just cloud/env/app.hostname.net/deploy <version>`:

## [Description](#description)

If you stay within the defined bounds, `cloudseed` aims to build, test, run, and deploy your application to any domain with the minimum of CLI commands, automating as much of the process as possible.

The core app is a database, hasura exposing graphql, browser and cloud functions interacting with graphql, and ancillary services.

The app can be highly available autoscaled beast, to a sleeping cloud function ready to wake up (eventually).

TODO: show diagram here

The CI/ops person or robot only uses the top-level `just` command and should not need to delve deeper unless diagnosing. Just high level tasks are exposed here.

### [Conventions](#conventions)

`just` commands docs that start with '🌱' are required for automation steps, for example `just app/build` is required by `ci/justfile` automation.

- `just`: show help, and list published images

## [/app](#/app)

- `just app/build`
- `just app/test`
- `just app/publish`
- `just app/dev`

## [/ci](#/ci)

Proposed commands (or something like it):

- `just ci/<provider>/test`
- `just ci/<provider>/publish <target>`

## [/cloud](#cloud)

Cloud (AWS, GCE, Azure, etc) infrastructure: docker registries, clusters, servers, databases, ...

## [cloud initialization](#cloud-initialization)

Before any service can be deployed, you need:

- cloud encryption keys (sops)
- docker registry(s)

### [Host requirements](#host-requirements)

- `just`: https://github.com/casey/just#installation
  - `brew install just`
- `mkcert`: https://github.com/FiloSottile/mkcert#installation
  - `brew install mkcert`
- `docker`

Optional host requirements:

(rule: if you attempt a process but you're missing a tool, we will politely tell you how to fix. So try things without worrying).

- development tools:
  - `app/browser` client development:
    - `node+npm`: https://nodejs.org/
    - `deno`: https://deno.land/manual/getting_started/installation
  - restart any process after edits:
    - `watchexec`: https://github.com/watchexec/watchexec
  - console dashboard with good easy operations of docker-compose (restart, logs)
    - `lazydocker`: https://github.com/jesseduffield/lazydocker
- repo scripting:
  - `deno`: https://deno.land/manual/getting_started/installation

**Proposal**

Example:

Initialize the minimum required for deployments into a given cloud provider:

```
just cloud/lib/provider/aws/init <params>
```

⬆ puts configuration and encrypted stuff in:

```
cloud/provider/aws/default/config-stuff
```

`default` means that. Maybe you want to have MULTIPLE cloud accounts in the same provider? Who are we to judge?

I don't know what `config-stuff` is. Maybe a single yaml file with all needed secrets and config that sops can handle?

Later on when you actually deploy something the deployment specific config/state might live in:

```
cloud/provider/aws/default/env/app.hostname.net/
```

I think we're imagining safely encrypted terraform config?

## [cloud deployments](#cloud-deployments)

Proposed commands (or something like it):

- `just cloud/info`
  - shows a summary of all cloud resources
- `just cloud/provider/aws/info`
  - shows a summary of AWS only cloud resources
- `just cloud/provider/aws/app.hostname.net/deploy <version> [service 1] [service 2] ...` (or something similar)
  - deploys the application (or subset of) to the given endpoint: `app.hostname.net`
  - `app.hostname.net` is just the main URL, it doesn't preclude other URL endpoints. Think of it as an (cloud) unique identifier.
    - This is all about deploying git repository encoded applications to URL endpoints, so let's be opinionated?
- `just cloud/aws/provider/app.hostname.net/destroy`
  - yeah nuke everything

It's assumed that the `version`ed docker images are available, otherwise error.

### /deploy: steps from scratch

This section is currently speculative, think of this as high level intentions and psuedo-commands.

Ideas:

- store initial terraform once-only deployment state _encrypted_ in a special protected branch `state-deploy`
- (cloud) encryption _might_ have to be done manually
- initialization is documented, where manual steps are needed, document as "Click on button XYZ" as a list of interactions
  - screenshots age pretty quickly
- Someone like me with no idea of the internals can still operate the basic high level just @commands

### /deploy: first initialize deployment

Before we can e.g. install or create config for circle.ci, we need e.g. docker registries in AWS

We will assume for now that you'll only need one.

```
just deploy/cloud init <aws|gcp|azure> [parameters ...]
```

This will save some config, which we'll (possibly encrypt some/all) and store: `deploy/config/aws`?

Now the CI config can be created:

```
just ci/install circle.ci aws
```

This will e.g. create the `.circleci/config` file from a template pointing to the above initialized `aws` config (somehow)

After this, on commits, the CI provider will run our build/test/publish automatically to update docker images in the registry, and notify listeners to possibly update the deployment(s)

### Deployments

I think the _command_ to initialize the e.g. AWS provider should be:

`just cloud/lib/provider/aws/init <params>`

and the terraform _modules_ should live in `cloud/lib/provider/aws/terraform/`

and it should store it's terraform _config_:

`./cloud/provider/aws/init/terraform/`

then later on the actual deployed service terraform can live:

`./cloud/provider/aws/app.host.com/terraform/`

I imagine we'll put a justfile: `./cloud/provider/aws/app.host.com/justfile` that will contain the high level deploy commands

That way we keep cloud provider initialization separate from the actual deployed services, and the libraries separated out.
