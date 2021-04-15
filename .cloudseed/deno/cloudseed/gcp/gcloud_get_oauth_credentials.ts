/**
 * Assume this script is run in the vouch directory
 * Provides instructions for a human to create oauth credentials
 * and saves+encrypts locally.
 */
import Ask from "https://deno.land/x/ask@1.0.5/mod.ts";
import * as Colors from "https://deno.land/std@0.83.0/fmt/colors.ts";
import { existsSync } from "https://deno.land/std@0.83.0/fs/mod.ts";
import { run } from "../../exec/mod.ts";

const OAUTH_CREDENTIALS_FILE = 'secrets.encrypted.json';
if (existsSync(OAUTH_CREDENTIALS_FILE)) {
    console.log('👍 oauth credentials');
    Deno.exit(0);
}

const fqdn = Deno.cwd().split('/')[Deno.cwd().split('/').length - 3];

if (!existsSync('../locals.json')) {
    throw `no locals.json file found in cloud/env/${fqdn}/gcp/locals.json. 🛠 <cloud/env/${fqdn}/gcp> just apply`
}
const PROJECT_CONFIG :{project_id:string} = JSON.parse(Deno.readTextFileSync('../locals.json'));

console.log(` 🛠  OAuth credential setup is currently not possible to automate, must be done manually.`);
console.log(` 🛠  Follow these steps:`);
const instructions = `
    1) OAuth Consent Screen:
        - 👉 🔗 ${Colors.green(Colors.bold(`https://console.cloud.google.com/apis/credentials/consent?orgonly=true&project=${PROJECT_CONFIG.project_id}&supportedpurview=organizationId`))}
        - Select ${Colors.green("External")} (unless this is an organization internal app)
        - Fill in the details
        - ${Colors.bold("Scopes")}: ${Colors.green("SAVE AND CONTINUE")}
        - ${Colors.bold("Test users")}: ${Colors.green("SAVE AND CONTINUE")}
        - ${Colors.bold("Summary")}: ${Colors.green("BACK TO DASHBOARD")}
        - ${Colors.bold("Publishing Status")}: ${Colors.green("PUBLISH APP")}
    2) OAuth credential setup and creation:
        - 👉 🔗 ${Colors.green(Colors.bold(`https://console.cloud.google.com/apis/credentials?orgonly=true&project=${PROJECT_CONFIG.project_id}&supportedpurview=organizationId`))}
        - Click: ${Colors.green("+ CREATE CREDENTIALS")}
        - Select: ${Colors.green("OAuth client ID")}
        - Application type: ${Colors.green("Web application")}
        - ${Colors.green("Name")}: anything you like, but recommended: "${fqdn}" (domain name of the app)
        - ${Colors.green("Authorized JavaScript origins")}: empty
        - ${Colors.green("Authorized redirect URIs")}:
            - ${Colors.bold(`https://oauth.${fqdn}:443/auth`)}
                - NB: the port is added here since it can be modified when developing locally (multiple concurrent stacks on your dev machine)
        - ${Colors.green("Create")}
        - Copy credentials below:
`;

console.log(instructions);

const ask = new Ask(); // global options are also supported! (see below)

const secrets = await ask.prompt([
  {
    name: 'oauth_client_id',
    type: 'input',
    message: "Your Client ID:"
  },
  {
    name: 'oauth_client_secret',
    type: 'input',
    message: "Your Client Secret:"
  }
]);

Deno.writeTextFileSync(OAUTH_CREDENTIALS_FILE, JSON.stringify(secrets));

await run(`just ../provider encrypt ${Deno.cwd()}/${OAUTH_CREDENTIALS_FILE}`)
    .pipeString();
