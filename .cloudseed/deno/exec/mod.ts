import { v4 } from "https://deno.land/std@0.83.0/uuid/mod.ts";
import { existsSync } from "https://deno.land/std@0.83.0/fs/mod.ts";
import * as Colors from "https://deno.land/std@0.83.0/fmt/colors.ts";

export * from "./run.ts";

function splitCommand(command: string): string[] {
  var myRegexp = /[^\s"]+|"([^"]*)"/gi;
  var splits = [];

  do {
    //Each call to exec returns the next regex match as an array
    var match = myRegexp.exec(command);
    if (match != null) {
      // Index 1 in the array is the captured group if it exists Index 0 is the matched text, which we use if no captured
      // group exists
      splits.push(
        match[1]
          ? match[1]
          : match[0]
      );
    }
  } while (match != null);

  return splits;
}

export enum OutputMode {
  None = 0, // no output, just run the command
  StdOut, // dump the output to stdout
  Capture, // capture the output and return it
  Tee, // both dump and capture the output,,,
}

export interface IExecStatus {
  code: number;
  success: boolean;
}

export interface IExecResponse {
  status: IExecStatus;
  output: string;
}

interface IOptions {
  output?: OutputMode;
  verbose?: boolean;
  continueOnError?: boolean;
  cwd?: string;
  printCommand?: boolean;
  env?: { [key: string]: string };
}

/**
 * Main function to run CLI commands
 */
export const exec = async (command: string, options: IOptions = {
  output: OutputMode.Tee,
  verbose: false,
  cwd: Deno.cwd(),
  printCommand: true,
  continueOnError: false,
}): Promise<IExecResponse> => {
  let splits = splitCommand(command);

  const cwd = options.cwd || Deno.cwd();

  const printCommand = options.printCommand === undefined ? true : options.printCommand;

  let uuid = "";
  if (options.verbose) {
    uuid = v4.generate();
    console.log(``);
    console.log(`Exec Context: ${uuid}`);
    console.log(`    Exec Options: `, options);
    console.log(`    Exec Command: ${command}`);
    console.log(`    Exec Command Splits:  [${splits}]`);
  }
  if (printCommand) {
    // get path minus home
    console.log(`🚪 <${cwd.replace(Deno.env.get('WORKSPACE') as string, '')}/> ${Colors.bold(command)} 🚪`);
  }

  if (!existsSync(cwd)) {
    throw `command: '${command} failed error: "${cwd} does not exist"`;
  }
  let p = Deno.run({ cmd: splits, stdout: "piped", stderr: "inherit", cwd: cwd, env:options.env});

  let response = "";
  let decoder = new TextDecoder();

  if (p && options.output != OutputMode.None) {
    const buff = new Uint8Array(1);
    while (true) {
      try {
        let result = await p.stdout.read(buff);
        if (!result) {
          break;
        }
        if (options.output == OutputMode.Capture || options.output == OutputMode.Tee) {
          if (result) {
            response = response + decoder.decode(buff);
          }
        }
        if (options.output == OutputMode.StdOut || options.output == OutputMode.Tee) {
          await Deno.stdout.write(buff);
        }
      } catch (ex) {
        console.log("ex", ex);
        break;
      }
    }
  }

  let status = await p.status();
  // let stdoutBuff = await p.stderrOutput();   let stdout = await p.stdoutOutput();
  // console.log(Colors.red(decoder.decode(stdout)))   if (stdoutBuff) {
  // console.error(Colors.red(decoder.decode(stdoutBuff)))   }   p.stdout?.close();
  p.close();

  let result = {
    status: {
      code: status.code,
      success: status.success
    },
    output: response.trim(),
    // stderr: decoder.decode(stdoutBuff),,,,
  };
  if (options.verbose) {
    console.log("Exec Result: ", result);
    console.log(`Exec Context: ${uuid}`);
    console.log(``);
  }
  if (status.code !== 0 && !options.continueOnError) {
    throw `status.code=${status.code}`;
  }
  return result;
};

export const execSequence = async (commands: string[], options: IOptions = {
  output: OutputMode.StdOut,
  continueOnError: false,
  verbose: false
}): Promise<IExecResponse[]> => {
  let results: IExecResponse[] = [];

  for (let i = 0; i < commands.length; i++) {
    let result = await exec(commands[i], options);
    results.push(result);
    if (options.continueOnError == false && result.status.code != 0) {
      break;
    }
  }

  return results;
};
