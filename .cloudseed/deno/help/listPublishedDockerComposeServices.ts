/**
 * Just list the graphql-app services that will be published/cached
 * Any docker-compose.*yml service with "x-publish: true" extension field: https://docs.docker.com/compose/compose-file/#extension-fields
 *
 * --format=formatted|list|json        Different display options
 */
import { parse } from "https://deno.land/std@0.72.0/flags/mod.ts";
import { parse as parseYaml } from "https://deno.land/std@0.72.0/encoding/yaml.ts";
import { expandGlob } from "https://deno.land/std@0.72.0/fs/mod.ts";

interface DockerComposeService {
    "x-publish"?: boolean;
}
interface DockerComposeFile {
    services: { [key in string]: DockerComposeService }
}

const CLI_ARGS = parse(Deno.args);

let publishedServices: string[] = [];

for await (const file of expandGlob("docker-compose*.yml")) {
    if (file.isFile) {
        const text = await Deno.readTextFile(file.path);
        const obj: DockerComposeFile = parseYaml(text) as any;
        Object.keys(obj.services).forEach(serviceId => {
            const service: DockerComposeService = obj.services[serviceId];
            if (service["x-publish"]!! && publishedServices.indexOf(serviceId) == -1) {
                publishedServices.push(serviceId);

            }
        });
    }
}

publishedServices.sort();

if (CLI_ARGS['format'] === 'list') {
    console.log(publishedServices.join(' '));
} else if (CLI_ARGS['format'] === 'json') {
    console.log(JSON.stringify(publishedServices));
} else {
    console.log('  docker-compose.yml images to publish (x-publish:true):');
    publishedServices.forEach(serviceId => {
        console.log(`    - ${serviceId}`);
    });
}
