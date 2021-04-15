/**
 * Used by CLI scripts/functions requiring specific ENV vars set.
 * Require the listed { ENV:string|null}
 * as either in the env OR as the passed in object
 * If a required value is missing, exit with error.
 * Given a set of args, with values:
 *   - boolean true       : throw if missing, no default
 *   - boolean false      : not required
 *   - string             : default value if not given
 */

export const envArgs = <K extends string, T extends string | true>(required: Record<K, T>): Record<K, string> => {
// export const envArgs = (required :{[key in string]:string|null}): {[key in string]:string} => {
    const result: {
        [key: string]: any
    } = { ...required };
    // const env = Deno.env.toObject();
    // fill from env vars first
    Object.keys(required).forEach((key: string) => {
        if (Deno.env.get(key)) {
            result[key] = Deno.env.get(key);
        }
    });
    // throw if a required arg is missing
    Object.keys(required).forEach(key => {
        if (result[key] === true) {
            throw `Missing: env var "${key}`;
        }
    });
    // Object.keys(required).forEach((k :string) => {
    //     if (env[k]) {
    //         result[k] = env[k];
    //     } else {
    //         const value :string|null = required[k];
    //         if (value !== null && value !== undefined) {
    //             result[k] = value;
    //         } else {
    //             throw `Missing required env var : ${k}`;
    //         }
    //     }
    // });
    return result as Record<K, string>;
};
