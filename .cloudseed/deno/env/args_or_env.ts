/**
 * Used by CLI scripts/functions requiring specific ENV vars set.
 * Require the listed { ENV:string|null}
 * as either in the env OR as theh passed in object
 * If a required value is missing, exit with error.
 * This is used by many commands
 */

import { parse } from "https://deno.land/std/flags/mod.ts";

/**
 * Pass in a map of required env var values, they can also be pulled
 * from the CLI
 * env var format: THIS_IS_AN_ARG=VALUE
 * cli arg format: --this-is-an-arg=value
 * Given a set of args (env var format: ARG_THING, *not* art-thing), with values:
 *   - boolean true       : throw if missing, no default
 *   - boolean false|null : not required
 *   - string             : default value if not given
 * then get the arguments in this order of priority:
 *  1. the env var
 *  2. the CLI
 *  3. the passed in default
 */
export const getArgsFromEnvAndCli = <K extends string, T extends string | boolean>(required: Record<K, T>): Record<K, string> => {
    const result: {
        [key: string]: any
    } = {  };

    // fill from env vars first
    Object.keys(required).forEach((key: string) => {
        if (Deno.env.get(key)) {
            result[key] = Deno.env.get(key);
        }
    });

    // then replace from the command line
    const cliArgs = parse(Deno.args);

    Object.keys(required).forEach((requiredKey: string) => {
        const cliKey = convertEnvVarToCli(requiredKey);
        if (cliArgs[cliKey]) {
            result[requiredKey] = cliArgs[cliKey];
        }
    });

    // fill in the defaults
    Object.keys(required).forEach((key) => {
        if (result[key as K] === undefined && typeof(required[key as K]) === 'string') {
            result[key as K] = required[key as K];
        }
    });

    // throw if a required arg is missing
    Object.keys(required).forEach((key) => {
        if (required[key as K] === true && result[key as K] === undefined) {
            throw `Missing: env var "${key}=" or argument "--${convertEnvVarToCli(key)}"`;
        }
    });

    return result as Record<K, string>;
}

const convertEnvVarToCli = (s: string) => s.replaceAll('_', '-').toLowerCase();
