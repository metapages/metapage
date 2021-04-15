/**
 * Ensures a docker container is running detached.
 * env vars:
 *  DOCKER_COMPOSE: docker-compose command to override
 * args:
 *  <docker componse service>
 * example:
 *  deno run --allow-env ./ensureContainerBackgroundRunning.ts <service>
 */
import { ensureContainerIsRunning } from "../mod.ts";
import {parse} from "https://deno.land/std/flags/mod.ts";

const service = parse(Deno.args)._[0] as string;
console.log("target", service);
if (!service) {
  console.log("🔥🔥🔥 Missing <service> argument");
  Deno.exit(1);
}

const p = await ensureContainerIsRunning({service});
console.log('p', p);
