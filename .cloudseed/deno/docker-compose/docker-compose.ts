// deno scripts
// import specific files (not mod.ts) otherwise compile errors with --unstable
import {existsSync} from "https://deno.land/std/fs/exists.ts";
import {parse as parseYaml} from "https://deno.land/std/encoding/yaml.ts";
import {getNearestFileWithPrefix} from "../fs/mod.ts";
import {basename, dirname, parse} from "https://deno.land/std/path/mod.ts";

export const isInsideDocker = (): boolean => {
  return existsSync("/.dockerenv");
};

export const getNearestComposeFile = (): string | undefined => {
  return getNearestFileWithPrefix("docker-compose.yml");
};

// the name of the parent directory which is used as the stack prefix
export const getComposeProject = (composeFile? : string): string | undefined => {
  composeFile = composeFile
    ? composeFile
    : getNearestComposeFile();
  if (!composeFile) {
    throw "No compose file found, cannot guess docker-compose project";
  }
  return parse(parse(composeFile).dir).name;
};

export const guessDockerComposeNetworkName = (composeFile? : string): string | undefined => {
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
  } = parseYaml(new TextDecoder("utf-8").decode(Deno.readFileSync(composeFile)))as any;
  const firstNetworkName = Object.keys(composeYaml.networks)[0];
  const dir = basename(dirname(composeFile));
  return `${dir}_${firstNetworkName}`;
};

/**
 * Make sure we're inside a named docker-compose service
 * defaulting to a sh shell
 * @param args service: docker-compose service name
 */
export const ensureInsideService = async (args : {
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

  let {service, debug, shell, runArgs} = args;

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

  const p = Deno.run({cmd: cmd, cwd: parse(composeFile).dir, env: Deno.env.toObject()});
  await p.status();
  return true;
};
