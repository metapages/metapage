import Ask from "https://deno.land/x/ask@1.0.5/mod.ts";
import { parse } from "https://deno.land/std@0.83.0/flags/mod.ts";

let { answer, question } = parse(Deno.args);

if (!answer || !question) {
    console.log('requires --answer and --question');
    Deno.exit(1);
}

const { response } = await new Ask().input({
    name: 'response',
    message: question,
});
if (answer !== response) {
    Deno.exit(1);
}
