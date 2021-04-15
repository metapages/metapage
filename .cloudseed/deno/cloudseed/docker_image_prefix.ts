/**
 * Computes and prints to stdout the DOCKER_IMAGE_PREFIX
 * This is usually "octocat/Hello-World/" (<repo owner>/<repo name>)
 * Note the trailing slash, this is so appending docker URLs is easier
 * But:
 * The GitHub Container Registry hosts containers at ghcr.io/OWNER/IMAGE-NAME  (https://docs.github.com/en/free-pro-team@latest/packages/guides/about-github-container-registry)
 * This means that metapages/repo1/image:tag conflicts with
 *                 metapages/repo2/image:tag
 * because they have the same "owner": metapages
 * Very annoying. Now I cannot use generic image names between repositories e.g. "api" or "graphql"
 * unless the github stored image is e.g. metapages/repo2/repo2-image:tag
 * since "repo1" and "repo2" are ignored when github creates the entire image URL
 * This shouldn't conflict with deployment because deployment images are pulled/built/pushed using
 * the cloud container registry, NOT the github container registry. The github container registry
 * is only used for caching builds for running tests etc
 */
import { getRepositoryName } from "./mod.ts";

const repoName :string = await getRepositoryName();
// Is this running in Github Actions? Then it tell us the repository name, for example, octocat/Hello-World.
// https://docs.github.com/en/actions/configuring-and-managing-workflows/using-environment-variables
if (Deno.env.get('GITHUB_ACTIONS') === 'true') {
    // See comment at top.
    const words = repoName.split('/');
    // octocat/Hello-World/ => octocat/octocat-Hello-World
    // note we do NOT add the trailing slash
    // This turns <registry>/<owner>/<repo>/<name>:<sha>
    //       into <registry>/<owner>/<repo-name>:<sha>
    //    since github stores as
    //            <registry>/<owner>/<repo-name>:<sha>
    console.log(`${words[0]}/${words[1]}-`);
} else {
    console.log(`${repoName.endsWith('/') ? repoName.substr(0, repoName.length - 1) : repoName}/`);
}
