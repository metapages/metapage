/**
 * Pulls, builds, and pushes a docker image that depends on a running hasura service to generate graphql bindings
 * Example:
 *      buildDockerImageGraphqlDependent.ts [--skip-remote] <TARGET>
 * Arguments:
 *      --skip-remote       skips pulling and pushing the :cache tagged version (for faster future builds)
 *      --debug             prints command stdout to console. Also set with env var DEBUG=1 or DEBUG=true
 * This makes a bunch of assumptions:
 *  1) it's for building an image that depends on hasura running
 *  2) you need an existing network stack to e.g. build the graphql bindings from a running graphql server
 *  3) you want to pull and push (for caching) if a DOCKER_REGISTRY and DOCKER_IMAGE_PREFIX are given
 *  4) you tag the image <DOCKER_REGISTRY><DOCKER_IMAGE_PREFIX>/<TARGET>:cache
 * @param props:
 *  TARGET                      :browser
 *  DOCKER_REGISTRY             :ghcr.io
 *  DOCKER_TAG                  :cache or a git sha
 *  HASURA_GRAPHQL_ADMIN_SECRET :for generating graphql bindings from hasura
 */
import * as Colors from 'https://deno.land/std/fmt/colors.ts ';
import * as path from "https://deno.land/std/path/mod.ts";
import { parse } from "https://deno.land/std/flags/mod.ts";
import { ensureContainerIsRunning, exec, OutputMode } from "../mod.ts";
import { guessDockerComposeNetworkName } from "./mod.ts";
import { envArgs } from "../env/mod.ts";

const CLI_ARGS = parse(Deno.args);
const debug: boolean = CLI_ARGS['debug'] || Deno.env.get('DEBUG');
const TARGET: string = CLI_ARGS._[0] as string;

const SKIP_PULL_PUSH = CLI_ARGS['skip-remote'] == 'true' || CLI_ARGS['skip-remote'] == '1'
// assume image name is the same as the dirname, e.g. "browser"
// image name is the directory name
const IMAGE_NAME = TARGET;

let { DOCKER_TAG, HASURA_GRAPHQL_ADMIN_SECRET } = envArgs({ DOCKER_TAG: '', HASURA_GRAPHQL_ADMIN_SECRET: true });

const DOCKER_REGISTRY = Deno.env.get('DOCKER_REGISTRY') ? Deno.env.get('DOCKER_REGISTRY') : '';
if (!DOCKER_REGISTRY) console.log(Colors.yellow('Missing DOCKER_REGISTRY, not pulling or pushing, just building locally'));


const DOCKER_IMAGE_PREFIX = Deno.env.get('DOCKER_IMAGE_PREFIX') ? Deno.env.get('DOCKER_IMAGE_PREFIX') : '';
if (!DOCKER_IMAGE_PREFIX) console.log(Colors.yellow('Missing DOCKER_IMAGE_PREFIX, not pulling or pushing, just building locally'));

const DOCKER_IMAGE = `${DOCKER_REGISTRY}${DOCKER_IMAGE_PREFIX}${IMAGE_NAME}`

await ensureContainerIsRunning({ service: 'graphql', debug });

const runOptions = { cwd: path.join(Deno.cwd(), TARGET), env: Deno.env.toObject(), verbose: false, output: debug ? OutputMode.StdOut : OutputMode.Capture, printCommand: true };

let p;

// pull
if (DOCKER_REGISTRY && DOCKER_IMAGE_PREFIX && !SKIP_PULL_PUSH) {
    await exec(`docker pull ${DOCKER_IMAGE}:cache`, { ...runOptions, continueOnError: true });
};

// guess the existing network
const dockerComposeNetwork = guessDockerComposeNetworkName();

// actually build
await exec(`docker build --network=${dockerComposeNetwork} --tag ${DOCKER_IMAGE}:local --build-arg HASURA_GRAPHQL_ADMIN_SECRET=${HASURA_GRAPHQL_ADMIN_SECRET} .`, runOptions);

// tag if given
if (DOCKER_TAG !== 'local') {
    await exec(`docker tag ${DOCKER_IMAGE}:local ${DOCKER_IMAGE}:${DOCKER_TAG}`, runOptions);
};

// push tagged with "cache", for faster future builds
if (DOCKER_REGISTRY && DOCKER_IMAGE_PREFIX && !SKIP_PULL_PUSH) {
    if (DOCKER_TAG !== 'cache') { // if DOCKER_TAG=cache, this got tagged above
        await exec(`docker tag ${DOCKER_IMAGE}:local ${DOCKER_IMAGE}:cache`, runOptions);
    }
    await exec(`docker push ${DOCKER_IMAGE}:cache`, runOptions);
};
