Each directory is a whole app setup (network, database, cloud functions, instances, etc) to deploy the app.

There are broad customizable controls e.g. database size, but the overall stack layout is fixed.

If there are substantially different application stacks, then they have different directories here.

For example, two different types could be:
    1. stand-alone deployment
    2. kubernetets deployment (where there is an existing kubernetes cluster)
