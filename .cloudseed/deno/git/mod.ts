import { exec, OutputMode } from "../mod.ts";

export const getGitSha = async ({
    short,
}: { short?: number }): Promise<string> => {

    // Is this running in Github Actions? Then the repository name is the env var is e.g. GITHUB_REPOSITORY=octocat/Hello-World
    // https://docs.github.com/en/actions/configuring-and-managing-workflows/using-environment-variables
    if (Deno.env.get('GITHUB_ACTIONS') === 'true' && Deno.env.get('GITHUB_SHA')) {
        if (short) {
            return Deno.env.get('GITHUB_SHA')!.substr(0, short);
        } else {
            return Deno.env.get('GITHUB_SHA')!;
        }
        // otherwise try just using git, last resort because it may not be installed or the repo is a shallow clone
    } else {
        const result = await exec('git rev-parse HEAD', { output: OutputMode.Capture, continueOnError: false, printCommand: false });
        if (!result.status.success) {
            console.error(result.output);
            throw result;
        }
        // result.output = e.g. git@github.com:myname/myrepo.git
        const sha = result.output;
        if (short) {
            return sha.substr(0, short);
        } else {
            return sha;
        }
    }

}
