/**
 * CLI tool to create a new (or update an existing) terraform (terragrunt) configuration
 * for a deployment of the app.
 */

import * as path from "https://deno.land/std/path/mod.ts";
import { Command } from "https://deno.land/x/cliffy@v0.15.0/command/mod.ts";
import Random from "https://deno.land/x/random@v1.1.2/Random.js";
import { ensureDirSync, ensureSymlinkSync, existsSync } from "https://deno.land/std@0.74.0/fs/mod.ts";
import { paramCase } from "https://deno.land/x/case@v2.1.0/mod.ts";
import { Provider, ROOT, APP_PROVIDER_ROOT, getDirectoriesSync, getFilesSync, getProviders} from "./mod.ts";

type ResourceName = string;
type ResourceOptions = Record<ResourceName, string[]>;
type ResourceSelection = Record<ResourceName, string>;

interface CreateOptions {
  provider: string;
  fqdn: string;
  region: string;
  resources: Record<ResourceName, string>;
  // optionally ONLY update a single selected resource
  update ?: string;
}

interface PersistedResourceOptions {
  type: string;
}
interface PersistedCreateOptions {
  project_id: string;
  region: string;
  location: string;
  location_short: string;
  resources: Record<ResourceName, PersistedResourceOptions>;
}

/**
 * Main logic after all the CLI arg parsing:
 * Copy:
 *   - root provider files
 *   - specified resource terragrunt configs
 * to the directory: /repo/cloud/${fqdn}/${provider}.
 * After you can go into the directory and run the command: TODO
 */
const createOrUpdate: (args: CreateOptions) => Promise<void> = async ({ provider, fqdn, resources, region, update }) => {
  const DEPLOYMENT_ROOT = `${ROOT}/cloud/${fqdn}`;
  const TARGET = `${DEPLOYMENT_ROOT}/${provider}`;
  // this needs to be relative so the root path can be configured independently without breaking soft links
  // broken soft links play hell with host code editors
  const SOURCE_ROOT = `../.cloudseed/cloud/lib/terragrunt/app/${provider}`;

  try {
    ensureDirSync(TARGET);
  } catch(err) {
    console.error(`Failed to ensure directory exists: ${TARGET}, error: ${err}`);
    Deno.exit(1);
  }

  // check for resources that exist but are not passed in 'resources'
  // they should be deleted, but if they contain terraform resources
  // then that's bad, so fail if directories exist: they need to be
  // manually 'just destroy' then rm -rf <resource>
  for (const dirEntry of Deno.readDirSync(TARGET)) {
    if (dirEntry.isDirectory && !dirEntry.name.startsWith('.')) {
      if (!resources[dirEntry.name] && (!update || update === dirEntry.name)) {
        console.log(`🚪 💥💥💥 resource "${dirEntry.name}" already exists, but you are attempting to set resource to "none" 🚪`);
        console.log(`🚪 🛠🛠🛠 FIX:      just ${TARGET}/${dirEntry.name}/destroy`);
        console.log(`                   rm -rf ${TARGET}/${dirEntry.name}`);
        Deno.exit(1);
      }
    }
  }

  if (!update) {
    console.log('Copying application provider configuration:');
  }

  // root justfile
  if (!update) {
    Deno.chdir(DEPLOYMENT_ROOT);
    await createSymlink(`../../.cloudseed/cloud/lib/terragrunt/app/justfile`, 'justfile')
    Deno.chdir(TARGET);
    // symlink the root terragrunt.hcl
    await createSymlink(`../../${SOURCE_ROOT}/terragrunt.config.hcl`, 'terragrunt.config.hcl');
    // root provider justfile
    await createSymlink(`../../${SOURCE_ROOT}/justfile`, 'justfile')
  }

  // then symlink the child terragrunt.hcl files
  for (const resource of Object.keys(resources)) {
    if (update && update !== resource) {
      continue;
    }

    const targetDir = `${TARGET}/${resource}`;
    ensureDirSync(targetDir);
    Deno.chdir(targetDir);

    const sourceRoot = `../../../${SOURCE_ROOT}/${resource}/${resources[resource]}`;

    let source :string|undefined;
    getFilesSync(sourceRoot).forEach(async f => {
      source = `${sourceRoot}/${f}`;
      if (existsSync(f)) {
        Deno.removeSync(f);
      }
      await createSymlink(source, f);
    });

    if (existsSync('justfile')) {
      Deno.removeSync('justfile')
    }
    source = `../../../${SOURCE_ROOT}/resource.justfile`;
    await createSymlink(source, 'justfile');
  }


  // cloud specific logic
  // e.g. generate db passwords
  // 🌱 generate 'locals.json' containing the configuration options and settings for the resources
  if (provider === 'gcp' && !update) {
    // generate a unique project id IF it doesn't exist
    const projectDefinitionFile = `${TARGET}/locals.json`;
    let locals :PersistedCreateOptions | null = null;
    if (existsSync(projectDefinitionFile)) {
      locals = JSON.parse(Deno.readTextFileSync(projectDefinitionFile));
      if (!locals) {
        throw `Failed to parse JSON: ${projectDefinitionFile}`;
      }
      locals.resources = {};
    } else {
      const r = new Random();
      let projectId = fqdn.replaceAll('.', '-');
      projectId = projectId.substr(0, 30);
      console.log(`🚪 create: ${TARGET.replace(`${ROOT}/cloud`, '.')}/locals.json with project_id: ${projectId} 🚪`);
      locals = {
        project_id: `${projectId}-${r.string(4)}`,
        region: region,
        location: region.replace(/[0-9]/g, ''),
        location_short: region.replace(/[0-9]/g, '').split('-').map(s => s[0]).join(''),
        resources:{},
      };
    }

    Object.keys(resources).forEach(k => locals!.resources[k] = {type:resources[k]});
    try {
      Deno.writeTextFileSync(projectDefinitionFile, JSON.stringify(locals!, null, '  '));
    } catch(err) {
      console.error(`💥 Failed to write ${projectDefinitionFile} error: ${err}`);
    }
  }

  if (!update) {
    console.log(` NEXT STEPS:`);
    console.log(`            🛠    cd ${TARGET} && just apply`);
    console.log(`        OR: 🛠    just ${TARGET}/apply`);
    console.log(`\n        See for manual additional steps: ${ROOT}/cloud/lib/provider/${provider}/playbook.md`);
  }
};

const run = async () => {
  const command = new Command().name("create");
  command.description("Create a new deployment (or update existing) of the app in a cloud provider (AWS, GCE, etc)");

  let isProviderCommand = false;

  Object.keys(resourceOptions).forEach(provider => {
    const providerCommand = new Command();
    providerCommand.description(`Create or update your app using the [${provider}] cloud provider`)


    providerCommand.option('--region [region]', "https://cloud.google.com/about/locations/#regions", { default: 'us-central1' });
    providerCommand.option('--update [resource]', "Update *only* the named resource, ignore others");

    const resources = resourceOptions[provider];
    Object.keys(resources).forEach(resourceName => {
      const resourceTypesAvailable :string[] = resources[resourceName];
      let resourceDeploymentOptions = { default: resourceTypesAvailable[0] };
      const extraOptionsFile = path.join(APP_PROVIDER_ROOT, provider, resourceName, 'cli-options.json');
      if (existsSync(extraOptionsFile)) {
        try {
          const extraOptions = JSON.parse(Deno.readTextFileSync(extraOptionsFile));
          resourceDeploymentOptions = Object.assign(resourceDeploymentOptions, extraOptions);
        } catch (err) {
            console.error(err);
            console.error(`💥 Failed to parse resource options file: ${extraOptionsFile}`);
        }
      }
      // If there is an EXISTING deployment, then the default resource type is the EXISTING type, otherwise just use the first in the list
      providerCommand.option(`--${resourceName} [${resourceTypesAvailable.join('|')}]`, "🌱 deployment type (if resource exists, defaults to existing)", resourceDeploymentOptions)
    });
    providerCommand.arguments("[hostname]");
    providerCommand.action(async (options: ResourceSelection, hostname: string) => {
      isProviderCommand = true;
      if (hostname === 'help' || !hostname) {
        providerCommand.help();
        return;
      }
      // copy
      const filteredResources = Object.keys(options).filter(o => resources[paramCase(o)]).reduce<ResourceSelection>((obj: ResourceSelection, key: string): ResourceSelection => {
        const paramCaseKey = paramCase(key);
        obj[paramCaseKey] = options[key];
        return obj;
      }, {});
      createOrUpdate({ provider, region: options.region, fqdn: hostname, resources: filteredResources, update:options.update });
    });

    command.command(provider, providerCommand);
  });

  command.example(
    "Create a new (or update an existing)\napp in Google Compute Engine (gcp)\nat the domain myapp.com",
    `\n\ncreate gcp myapp.com`,
  )
  command.example(
    "Create a new (or update an existing)\napp in AWS at the domain myapp.com\nbut change the api resource\nto an instance",
    `\n\ncreate aws --api=instance myapp.com`,
  )
  const { args } = await command.parse(Deno.args);
  if (args.length === 0 && !isProviderCommand) {
    command.help();
  }
}

/* Each subdirectory of a resource becomes the different options for that resource on the CLI */
const generateResourceOptions = (): Record<Provider, ResourceOptions> => {
  const result: Record<Provider, ResourceOptions> = {};
  for (const provider of getProviders()) {
    result[provider] = {};
    const providerRootPath = path.join(APP_PROVIDER_ROOT, provider);
    if (!existsSync(providerRootPath)) {
      throw `💥 ${providerRootPath} not found`;
    }
    for (const resource of getDirectoriesSync(providerRootPath)) {
      let resourceDeploymentOptions = getDirectoriesSync(path.join(providerRootPath, resource));
      resourceDeploymentOptions = resourceDeploymentOptions.filter(s => !(s.startsWith('_') || s.startsWith('DISABLED')))
      result[provider][resource] = resourceDeploymentOptions;
    }
  }
  return result;
}


const createSymlink = async (source:string, target:string) => {
  try {
    console.log(`🚪 symlink: <${Deno.cwd()}> ln -s ${source} ${target} `);
    ensureSymlinkSync(source, target);
  } catch(err) {
    console.error(`Failed:\n  <${Deno.cwd()}> ln -s ${source} ${target}\n  error: ${err}`);
    Deno.exit(1);
  }
}

const resourceOptions = generateResourceOptions();

await run();
