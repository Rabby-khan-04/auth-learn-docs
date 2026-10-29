import { existsSync } from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env");
if (!existsSync(envPath)) {
  console.error("[preflight] Missing .env. Copy .env.example to .env");
  process.exit(1);
}
console.log("[preflight] OK");
EOF
