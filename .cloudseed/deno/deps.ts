// ok now the actual exports
export {
    getComposeProject,
    guessDockerComposeNetworkName,
} from "./docker-compose/docker-compose.ts";

export { exec, OutputMode } from "./exec/mod.ts";

export { delay } from "./util/mod.ts";
