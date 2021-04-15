/**
 * VERY OPINIONATED SCRIPT, NOT DESIGNED FOR GENERAL USE OUTSIDE OF CLOUDSEED GRAPHQL TYPES GENERATION
 * Runs npm @graphql-codegen to generate graphql bindings from
 * a running graphql server with the default settings:
 * - src/graphql/queries.graphql (contain all your queries)
 * - src/graphql/generated/types (generated)
 * This is used in multiple repositories, so capture in a deno script
 */

import { ensureDir, exists } from "https://deno.land/std@0.83.0/fs/mod.ts";
import * as path from "https://deno.land/std@0.83.0/path/mod.ts";
import { YamlLoader } from "https://deno.land/x/yaml_loader@v0.1.0/mod.ts";
import { getArgsFromEnvAndCli } from "../env/mod.ts";
import { isInsideDocker } from "../docker-compose/mod.ts";
import { exec, OutputMode } from "../mod.ts";
import { wait_until_graphql_ready } from './wait_until_graphql_ready.ts';
import { delay } from "../util/mod.ts";

const args = getArgsFromEnvAndCli({
    APP_ORIGIN: false,
    HASURA_GRAPHQL_ADMIN_SECRET: true,
    NODE_ENV: 'production',
    GRAPHQL_CONFIG: 'src/graphql/codegen.yml',
    PORT_GRAPHQL: "8080",
    GRAPHQL_DOMAIN: isInsideDocker() ? 'graphql' : 'localhost',
    APP_FQDN: '',
    APP_PORT: '443',
});

let { APP_ORIGIN, HASURA_GRAPHQL_ADMIN_SECRET, GRAPHQL_CONFIG, APP_FQDN, APP_PORT, GRAPHQL_DOMAIN, PORT_GRAPHQL } = args;

// load the config, and get the expected output file
const yamlLoader = new YamlLoader();
const config = await yamlLoader.parseFile(GRAPHQL_CONFIG) as { generates: { [key in string]: any } };
const GRAPHQL_TARGET: string = Object.keys(config.generates)[0];

await ensureDir(path.dirname(GRAPHQL_TARGET));

// handle running on host or inside docker container
if (!APP_ORIGIN || APP_ORIGIN === `https://${APP_FQDN}:${APP_PORT}`) {
    APP_ORIGIN = `http://${GRAPHQL_DOMAIN}:${PORT_GRAPHQL}`;
}

await wait_until_graphql_ready(args);

const attempts = 5;
let attempt = 0;
do {
    console.log(`Attempt ${attempt}`);
    const execResult = await exec(`node_modules/@graphql-codegen/cli/bin.js --config ${GRAPHQL_CONFIG}`, { output: OutputMode.StdOut, env: { APP_ORIGIN, HASURA_GRAPHQL_ADMIN_SECRET }, continueOnError: true });
    if (execResult.status.code === 0 && execResult.status.success) {
        break;
    }
    await delay(5);
    attempt++;
} while (attempt < attempts)

const success = await exists(GRAPHQL_TARGET);
if (!success) {
    throw `Failed to generate graphql: ${GRAPHQL_TARGET}`;
}
