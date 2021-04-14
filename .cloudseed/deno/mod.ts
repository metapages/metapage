import { config } from "https://deno.land/x/dotenv/mod.ts";
config({ export: true, safe: true });

// ok now the actual exports
export {
    Graphql,
    graphqlFetch,
} from "./graphql/mod.ts";

export {
    getGitSha,
} from "./git/mod.ts";

export {
    isInsideDocker,
    getComposeProject,
    getNearestComposeFile,
    ensureInsideService,
    guessDockerComposeNetworkName,
    ensureContainerIsRunning,
} from "./docker-compose/mod.ts";

export {
    getNearestFileWithPrefix,
} from "./fs/mod.ts";

export {
    exec,
    execSequence,
    OutputMode,
} from "./exec/mod.ts";

export {
    delay,
} from "./util/mod.ts";
