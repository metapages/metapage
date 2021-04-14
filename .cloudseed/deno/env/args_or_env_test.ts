import {
    assertStrictEquals,
} from "https://deno.land/std@0.70.0/testing/asserts.ts";
import * as path from "https://deno.land/std/path/mod.ts";

Deno.test("getArgsFromEnvAndCli valid args", async () => {
    const script = path.join(path.dirname(import.meta.url), 'args_or_env_test_script.ts').replace('file:', '')
    const proc = Deno.run({

        cmd: ['deno', 'run', '--allow-all', script, '--key2=value2', '--key3=value3', '--key-4=value4'], env: {
            KEY1: 'value1',
            KEY3: 'value3wrong',
            KEY_4: 'value4wrong',
        },
        stderr: "null",
        stdout: "null",
    });
    const status = await proc.status();
    assertStrictEquals(status.code, 0);
    assertStrictEquals(status.success, true);
    proc.close();
});

Deno.test("getArgsFromEnvAndCli invalid args", async () => {
    const script = path.join(path.dirname(import.meta.url), 'args_or_env_test_script.ts').replace('file:', '')
    const proc = Deno.run({
        // KEY1 is missing, and key3/KEY3 are checking that cli overrides env not the other way around
        cmd: ['deno', 'run', '--allow-all', script, '--key2=value2', '--key3=value3wrong', '--key-4=value4'], env: {
            KEY3: 'value3',
            KEY_4: 'value4wrong',
        },
        stderr: "null",
        stdout: "null",
    });
    const status = await proc.status();
    assertStrictEquals(status.code, 1);
    assertStrictEquals(status.success, false);
    proc.close();
});
