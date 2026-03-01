import { spawnSync } from "node:child_process";

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";

const result = spawnSync("npx", ["next", "start", "-p", String(port), "-H", host], {
  stdio: "inherit",
  shell: process.platform === "win32"
});

process.exit(result.status ?? 1);

