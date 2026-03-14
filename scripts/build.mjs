import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import esbuild from "esbuild";

const watch = process.argv.includes("--watch");
const tscPath = path.resolve("node_modules", "typescript", "bin", "tsc");

if (!watch) {
  fs.rmSync("dist", { recursive: true, force: true });
}

const args = ["-p", "tsconfig.json", "--outDir", "dist"];
if (watch) {
  args.push("--watch", "--preserveWatchOutput");
}

await new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [tscPath, ...args], {
    stdio: "inherit"
  });

  child.on("exit", (code) => {
    if (watch || code === 0) {
      resolve(undefined);
      return;
    }
    reject(new Error(`TypeScript build failed with exit code ${code ?? "unknown"}.`));
  });
  child.on("error", reject);
});

if (!watch) {
  await esbuild.build({
    entryPoints: ["src/extension.ts"],
    outfile: "dist/extension.js",
    bundle: true,
    platform: "node",
    format: "cjs",
    target: "node20",
    external: ["vscode"],
    sourcemap: false,
    logLevel: "silent"
  });
}
