// deno scripts
// import specific files (not mod.ts) otherwise compile errors with --unstable
import { existsSync } from "https://deno.land/std/fs/exists.ts";
import { parse as parseYaml } from "https://deno.land/std/encoding/yaml.ts";
import { basename, dirname, parse as parsePath } from "https://deno.land/std/path/mod.ts";
import * as Colors from 'https://deno.land/std/fmt/colors.ts ';
import { delay, exec, OutputMode, getNearestFileWithPrefix } from "../mod.ts";

export const isInsideDocker = (): boolean => {
  return existsSync("/.dockerenv");
};

export const getNearestComposeFile = (): string | undefined => {
  return getNearestFileWithPrefix("docker-compose.yml");
};

// the name of the parent directory which is used as the stack prefix
export const getComposeProject = (composeFile?: string): string | undefined => {
  composeFile = composeFile
    ? composeFile
    : getNearestComposeFile();
  if (!composeFile) {
    throw "No compose file found, cannot guess docker-compose project";
  }
  return parsePath(parsePath(composeFile).dir).name;
};

export const guessDockerComposeNetworkName = (composeFile?: string): string | undefined => {
  if (!composeFile) {
    composeFile = getNearestComposeFile();
  }

  if (!composeFile) {
    throw "No compose file found, cannot guess docker-compose network";
  }

  // get first network name
  const composeYaml: {
    networks: {
      [key: string]: any;
    };
  } = parseYaml(new TextDecoder("utf-8").decode(Deno.readFileSync(composeFile))) as any;
  const firstNetworkName = Object.keys(composeYaml.networks)[0];
  const dir = basename(dirname(composeFile));
  return `${dir}_${firstNetworkName}`;
};

/**
 * Make sure we're inside a named docker-compose service
 * defaulting to a sh shell
 * @param args service: docker-compose service name
 */
export const ensureInsideService = async (args: {
  service: string;
  shell: string;
  runArgs?: string[];
  debug?: boolean;
}): Promise<boolean> => {
  if (!args) {
    throw "Missing args";
  }
  if (!args.service) {
    throw "Missing 'service' field in args";
  }

  let { service, debug, shell, runArgs } = args;

  // inside docker, assume it's the desired service
  if (existsSync("/.dockerenv")) {
    if (debug) {
      console.log("/.dockerenv found, assuming already inside docker-compose stack");
    }
    return true;
  }

  const composeFile = getNearestComposeFile();
  if (!composeFile) {
    throw "No compose file found, cannot guess docker-compose network prefix";
  }

  const composeProject = getComposeProject(composeFile);

  if (debug) {
    console.log(`Found docker-compose project: ${composeProject}`);
  }

  let cmd = ["docker-compose", "run"];
  cmd = runArgs
    ? cmd.concat(runArgs)
    : cmd;
  cmd = cmd.concat([
    service, shell
      ? shell
      : "sh"
  ]);

  const p = Deno.run({ cmd: cmd, cwd: parsePath(composeFile).dir, env: Deno.env.toObject() });
  await p.status();
  return true;
};

/**
 * Ensures a docker container is running detached.
 * env vars:
 *  DOCKER_COMPOSE: docker-compose command to override
 * args:
 *  <docker componse service>
 * example:
 *  deno run --allow-env ./ensureContainerBackgroundRunning.ts <service>
 */
export const ensureContainerIsRunning = async ({
  service,
  debug,
}: { service: string, debug?: boolean }): Promise<boolean> => {
  if (!service) {
    throw "Missing <service> argument";
  }

  let DOCKER_COMPOSE = Deno
    .env
    .get("DOCKER_COMPOSE") || "docker-compose";

  const isContainerHealthy = async () => {
    let { output } = await exec(`${DOCKER_COMPOSE} ps ${service}`, { output: OutputMode.Capture });
    return output.includes("Up (healthy)");
  };

  const healthy = await isContainerHealthy();
  if (debug) {
    console.log(`    👍 ${Colors.bold(service)} is running and healthy`);
  }
  if (healthy) {
    return true;
  }

  if (!healthy) {
    if (debug) {
      console.log(`    ${Colors.bold(service)} not running, starting up...`);
    }
    const output = await exec(`${DOCKER_COMPOSE} up --detach ${service}`, { printCommand: true, output: debug ? OutputMode.Tee : undefined });
    if (output.status.code !== 0) {
      throw `Failed to start ${Colors.bold(service)}: ${JSON.stringify(output)}`;
    }
  }

  let { output } = await exec(`${DOCKER_COMPOSE} ps ${service}`);

  while (true) {
    const healthy = await isContainerHealthy();
    if (healthy) {
      break;
    }
    if (debug) {
      console.log("    .");
    }
    await delay(1000);
  }
  if (debug) {
    console.log(`    👍 ${Colors.bold(service)} ready!`);
  }
  return true;
}
