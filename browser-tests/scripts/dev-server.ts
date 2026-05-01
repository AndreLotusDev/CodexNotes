import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const repoRoot = process.cwd();
const runtimeDir = path.join(repoRoot, "browser-tests", ".runtime");
const databasePath = path.join(runtimeDir, "tinynotes.playwright.sqlite");
const nextCacheDir = path.join(repoRoot, ".next", "cache");
const port = process.env.PLAYWRIGHT_PORT ?? "3001";
const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;
const bunBinary = process.env.BUN_BINARY ?? "bun";
const nextDevArgs = process.argv.slice(2);

mkdirSync(runtimeDir, { recursive: true });
rmSync(databasePath, { force: true });
rmSync(nextCacheDir, { force: true, recursive: true });

const env = {
  ...process.env,
  DATABASE_PATH: databasePath,
  APP_URL: baseUrl,
  BETTER_AUTH_URL: baseUrl
};

await runCommand([bunBinary, "run", "migrate"], env);

const server = spawn(
  bunBinary,
  ["run", "--bun", "next", "dev", "--turbopack", "-p", port, "-H", "127.0.0.1", ...nextDevArgs],
  {
    cwd: repoRoot,
    env,
    stdio: "inherit"
  }
);

server.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

for (const eventName of ["SIGINT", "SIGTERM"] as const) {
  process.on(eventName, () => {
    server.kill(eventName);
  });
}

async function runCommand(command: string[], childEnv: NodeJS.ProcessEnv) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command[0], command.slice(1), {
      cwd: repoRoot,
      env: childEnv,
      stdio: "inherit"
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Command failed: ${command.join(" ")} (${code ?? "unknown"})`));
    });

    child.on("error", reject);
  });
}
