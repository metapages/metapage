import { run } from "../exec/run.ts";

const result = await run('git status --untracked-files=no --porcelain')
    .withEnv(Deno.env.toObject())
    .silent()
    .pipeString();

const foundChangeInApp = result
    .split('\n')
    .map(s => s.split(' ')[s.split(' ').length - 1])
    .find(e => e.startsWith('app/'));

if (foundChangeInApp) {
    console.error(result);
    console.error('commit all files in app/ first');
    Deno.exit(1);
}
