import {join, parse} from "https://deno.land/std/path/mod.ts";

/**
 * Return the first file found with the given prefix, in the current directory,
 * and continuing searching into the parent down to the root.
 * @param prefix
 */
export const getNearestFileWithPrefix = (prefix : string, root? : string | undefined): string | undefined => {
  let current = root
    ? root
    : Deno.cwd();
  let found: string | undefined = undefined;
  while (!found) {
    for (const dirEntry of Deno.readDirSync(current)) {
      if (dirEntry.name.startsWith(prefix)) {
        found = join(current, dirEntry.name);
        break;
      }
    }
    // not found
    const parsedPath = parse(current);
    // at the root
    if (parsedPath.dir === current) {
      return;
    }
    current = parsedPath.dir;
  }
  return found;
};

export const getPathDirectories = (path :string) :string[] => {
  return Array.from(Deno.readDirSync(path)).filter((fileInfo) => {
    return fileInfo.isDirectory && !fileInfo.name.startsWith('.');
  }).map(f => f.name);
}
