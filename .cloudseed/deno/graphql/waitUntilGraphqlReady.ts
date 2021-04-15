/**
 * Assumes you have started (or are starting) the docker graphql service on the host.
 */

import { envArgs } from "../env/mod.ts";
import { isInsideDocker } from "../docker-compose/mod.ts";
import { waitOn200StatusFromUrl } from "../net/mod.ts";

let { PORT_GRAPHQL } = envArgs({PORT_GRAPHQL:'8080'});

if (isInsideDocker()) {
    PORT_GRAPHQL = "8080";
}

// assumes that your hasura service is called graphql
const GRAPHQL_DOMAIN = isInsideDocker() ? 'graphql' : 'localhost';

console.log(`PORT_GRAPHQL=${PORT_GRAPHQL}`);

const url = `http://${GRAPHQL_DOMAIN}:${PORT_GRAPHQL}/healthz`;

console.log(`Waiting on ${url}`);
await waitOn200StatusFromUrl({url, interval:2000, requestTimeout:1000});
console.log(`graphql ready!`);
