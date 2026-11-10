import { execSync } from "child_process";
import fs from "fs";

async function run() {
  let target = "http://localhost:8000/openapi.json";
  let tempFileCreated = false;

  try {
    const res = await fetch(target, { signal: AbortSignal.timeout(1000) });
    if (!res.ok) throw new Error("Server not running");
  } catch {
    // API server is not running; build schema in-process
    const { buildServer } = await import("../apps/api/src/server.ts");
    const app = await buildServer({ testing: true });
    await app.ready();
    const swagger = app.swagger();
    fs.writeFileSync("openapi.json", JSON.stringify(swagger, null, 2));
    await app.close();
    target = "openapi.json";
    tempFileCreated = true;
  }

  try {
    execSync(`npx spectral lint ${target}`, { stdio: "inherit" });
  } finally {
    if (tempFileCreated && fs.existsSync("openapi.json")) {
      fs.unlinkSync("openapi.json");
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
