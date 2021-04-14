/**
 * I just want running external commands to be as simple as possible, and getting JSON results to be easy.
 * Failures always throw.
 *
 * const jsonBlob = await run('echo "foo"')
 *  .withEnv({SOME_VAR:true})
 *  .pipeJson()
 *
 * const result = await run('echo "foo"')
 *  .withEnv({SOME_VAR:true})
 *  .printCommand()
 *  .pipeString()
 */

import { getArgsFromEnvAndCli } from "../env/mod.ts";
import { exec, OutputMode } from "./mod.ts";
type Run = {
    withEnv: <K extends string, T extends string | true>(required: Record<K, T>) => Run;
    printCommand: () => Run;
    pipeJson: <J>() => Promise<J>;
    pipeString: () => Promise<string>;
    silent: () => Run;
}

type RunWith = {
    with: any;
}

export const run = (command: string): Run => {
    let runThing: Run;
    let env: Record<string, string> = {};
    let printCommand = false;
    let output = OutputMode.Tee;
    let parseJson = false;

    const execute = async (): Promise<string | any> => {
        const result = await exec(command, {
            output,
            printCommand,
        });
        if (result.status.code !== 0) {
            throw result;
        }
        if (parseJson) {
            return JSON.parse(result.output);
        }
        return result.output;
    }
    runThing = {
        withEnv: <K extends string, T extends string | true>(required: Record<K, T>) => {
            env = getArgsFromEnvAndCli(required);
            return runThing;
        },
        printCommand: () => { printCommand = true; return runThing },
        pipeString: async () => {
            return await execute()
        },
        pipeJson: async () => {
            parseJson = true;
            return await execute()
        },
        silent: () => {
            output = OutputMode.Capture;
            return runThing;
        },
    };

    return runThing;
}
