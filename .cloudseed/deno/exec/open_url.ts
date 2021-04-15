/**
 * Open a URL in whatever browser is configured on the host
 * independent of the OS.
 * If inside a docker container: print out the full URL instead.
 */
import { parse } from "https://deno.land/std@0.83.0/flags/mod.ts";
import * as Colors from "https://deno.land/std@0.83.0/fmt/colors.ts";
import { isInsideDocker } from "../docker-compose/mod.ts";

let url: string = parse(Deno.args)['_'][0] as string;

if (!url) {
    throw '💥 No URL argument given 💥: deno run --allow-all open_url.ts <URL>'
}

url = url.startsWith('http') ? url : `https://${url}`;

if (isInsideDocker()) {
    console.log("👇  Inside a docker container, cannot open URL so printing it out instead: 👇 ");
    console.log(`\n👉  ${Colors.green(Colors.bold(url))}\n`);
    Deno.exit(0);
}

if (Deno.build.os === 'linux') {
    const process = await Deno.run({ cmd: ['xdg-open', url] });
    const status = await process.status();
} else if (Deno.build.os === 'darwin') {
    const process = await Deno.run({ cmd: ['open', url] });
    const status = await process.status();
}
