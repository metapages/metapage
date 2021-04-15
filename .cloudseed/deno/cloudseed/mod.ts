import { exec, OutputMode } from "../exec/mod.ts";

export * from "./gcp/gcloud_terraform_project_id.ts";
export const ROOT: string = Deno.env.get('ROOT') || '/repo';
export const APP_PROVIDER_ROOT = `${ROOT}/.cloudseed/cloud/lib/terragrunt/app`;
export const DEPLOYMENTS_ROOT = `${ROOT}/cloud`;

export type Provider = string;

export const getDeployments = (): string[] => {
    return getDirectoriesSync(DEPLOYMENTS_ROOT).filter(d => !d.startsWith('.'));
}

export const getDirectoriesSync = (root: string): string[] => {
    const directories: string[] = [];
    for (const dirEntry of Deno.readDirSync(root)) {
        if (dirEntry.isDirectory && !dirEntry.name.startsWith('.')) {
            directories.push(dirEntry.name);
        }
    }
    return directories;
}

export const getFilesSync = (root: string): string[] => {
    const files: string[] = [];
    for (const dirEntry of Deno.readDirSync(root)) {
        if (!dirEntry.name.startsWith('.')) {
            files.push(dirEntry.name);
        }
    }
    return files;
}

/* Just returns the directories in the APP_PROVIDER_ROOT (not starting with ".") */
export const getProviders = (): Provider[] => {
    const directories: Provider[] = [];
    for (const dirEntry of Deno.readDirSync(APP_PROVIDER_ROOT)) {
        if (dirEntry.isDirectory && !dirEntry.name.startsWith('.')) {
            directories.push(dirEntry.name);
        }
    }
    return directories;
}

export const getRepositoryName: () => Promise<string> = async () => {

    // // If this is already supplied, use it
    // if (Deno.env.get('DOCKER_IMAGE_PREFIX') && Deno.env.get('DOCKER_IMAGE_PREFIX') !== '') {
    //     const dockerImagePrefix = Deno.env.get('DOCKER_IMAGE_PREFIX') as string;
    //     return dockerImagePrefix.substr(0, dockerImagePrefix.length - 1);
    // }

    // Is this running in Github Actions? Then it tell us the repository name, for example, octocat/Hello-World.
    // https://docs.github.com/en/actions/configuring-and-managing-workflows/using-environment-variables
    if (Deno.env.get('GITHUB_ACTIONS') === 'true' && Deno.env.get('GITHUB_REPOSITORY') && Deno.env.get('GITHUB_REPOSITORY') !== '') {
        return Deno.env.get('GITHUB_REPOSITORY') as string;
    }

    const result = await exec('git config --get remote.origin.url', { output: OutputMode.Capture, continueOnError: false, printCommand: false, env: Deno.env.toObject() });
    if (!result.status.success) {
        throw result;
    }

    // results.output = e.g. git@github.com:myname/myrepo.git
    return result.output.split(':')[1].replace('.git', '') ;
}
