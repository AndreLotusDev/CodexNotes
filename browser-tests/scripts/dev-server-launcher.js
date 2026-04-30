const { existsSync } = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const homeDir = process.env.USERPROFILE || process.env.HOME || "";
const repoRoot = path.resolve(__dirname, "..", "..");
const bunBinary = resolveBunBinary();

if (!bunBinary) {
  console.error("Unable to locate Bun. Set BUN_BINARY or add Bun to PATH before running Playwright.");
  process.exit(1);
}

const child = spawn(bunBinary, ["run", "./browser-tests/scripts/dev-server.ts"], {
  cwd: repoRoot,
  env: {
    ...process.env,
    BUN_BINARY: bunBinary
  },
  stdio: "inherit"
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

for (const eventName of ["SIGINT", "SIGTERM"]) {
  process.on(eventName, () => {
    child.kill(eventName);
  });
}

function resolveBunBinary() {
  const candidates = [
    process.env.BUN_BINARY,
    path.join(homeDir, ".bun", "bin", "bun.exe"),
    path.join(homeDir, ".bun", "bin", "bun")
  ].filter(Boolean);

  return candidates.find((candidate) => existsSync(candidate)) || null;
}
