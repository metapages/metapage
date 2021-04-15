import {
    assertStrictEquals,
} from "https://deno.land/std@0.70.0/testing/asserts.ts";
import { parse } from "https://deno.land/std/flags/mod.ts";

// expects:
// KEY1=value1
// --key2=value2
// KEY3=value3wrong and --key3=value3
// KEY_4=value4wrong and --key-4=value4
// key-5 == default5
// key-6 == undefined

import { getArgsFromEnvAndCli } from './mod.ts';

// First assert that our raw env and cli inputs are expected
assertStrictEquals(Deno.env.get('KEY1'), 'value1', 'KEY1 !== value1');
assertStrictEquals(Deno.env.get('KEY2'), undefined, 'KEY2 !== undefined');
assertStrictEquals(Deno.env.get('KEY3'), 'value3wrong', 'KEY3 !== value3wrong');
assertStrictEquals(Deno.env.get('KEY_4'), 'value4wrong', 'KEY_4 !== value4wrong');
assertStrictEquals(Deno.env.get('KEY_5'), undefined);
assertStrictEquals(Deno.env.get('KEY_6'), undefined);

const cliArgs = parse(Deno.args);
assertStrictEquals(cliArgs['key1'], undefined);
assertStrictEquals(cliArgs['key2'], 'value2');
assertStrictEquals(cliArgs['key3'], 'value3');
assertStrictEquals(cliArgs['key-4'], 'value4');
assertStrictEquals(cliArgs['key-5'], undefined);
assertStrictEquals(cliArgs['key-6'], undefined);

// then call the actual function and check results
const args = getArgsFromEnvAndCli({ KEY1: true, KEY2: true, KEY3: true, KEY_4: true, KEY_5: 'default5', KEY_6: '' });
assertStrictEquals(args.KEY1, 'value1');
assertStrictEquals(args.KEY2, 'value2');
assertStrictEquals(args.KEY3, 'value3');
assertStrictEquals(args.KEY_4, 'value4');
assertStrictEquals(args.KEY_5, 'default5');
assertStrictEquals(args.KEY_6, '');
