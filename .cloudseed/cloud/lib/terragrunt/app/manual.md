

Each directory is a whole app setup (network, database, cloud functions, instances, etc) to deploy the app.

There are broad customizable controls e.g. database size, but the overall stack layout is fixed.

If there are substantially different application stacks, then they have different directories here.

For example, two different types could be:
    1. stand-alone deployment
    2. kubernetets deployment (where there is an existing kubernetes cluster)

## Restrictions/Conventions

### terragrunt child directories must be in "param-case"

`paramCase`: https://deno.land/x/case@v2.1.0#paramcase

E.g. `this-thing`

The CLI arguments in `create.ts` are automatically converted to `camelCase`, so there is automatically hidden directory obfuscation.
 - for now: terragrunt child directories must be `in-param-case`
 - TODO: remove this restriction by mapping the changed CLI argument to the actual directory name
