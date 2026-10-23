import { stat } from "node:fs/promises";
import path from "node:path";

// npm runs workspace scripts from apps/web; Wrangler serves this directory.
export const clientAssetsDir = path.resolve("dist", "client");

export function outputDirectoryFromArgs(args = process.argv) {
  const outputArg = args.find((value) => value.startsWith("--output="));
  return path.resolve(outputArg?.slice("--output=".length) || clientAssetsDir);
}

export async function requireHtmlShell(shellPath) {
  try {
    if ((await stat(shellPath)).isFile()) return;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  throw new Error(`Missing Vite client HTML shell: ${shellPath}`);
}
