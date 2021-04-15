/**
 * Assumes you have started (or are starting) the docker graphql service on the host.
 */
import { isInsideDocker } from "../docker-compose/mod.ts";
import { waitOn200StatusFromUrl } from "../net/mod.ts";

export const wait_until_graphql_ready = async (args :{
    PORT_GRAPHQL: string, GRAPHQL_DOMAIN:string
  }) => {
    let {PORT_GRAPHQL, GRAPHQL_DOMAIN} = args;

    if (isInsideDocker()) {
        PORT_GRAPHQL = "8080";
        GRAPHQL_DOMAIN = 'graphql';
    }

    // assumes that your hasura service is called graphql

    const url = `http://${GRAPHQL_DOMAIN}:${PORT_GRAPHQL}/healthz`;

    console.log(`Waiting on ${url}`);
    await waitOn200StatusFromUrl({url, interval:2000, requestTimeout:1000});
    console.log(`graphql ready!`);
}
