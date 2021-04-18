# This is just a placeholder
# It's here because 'just /repo/create gcp --ingress=domain-mapping ..' does not
# require any actual terraform resources, but in /repo/cloud/env/<fqdn>/gcp/locals.json
# the value { "services": { "ingress" : <value> } } is read by other services and the
# create machinery makes a bunch of simple assumptions like assuming there are actual
# terraform resources to match with the 'just /repo/create' options. This might change
# in the future, but for now just use dummy resources.
