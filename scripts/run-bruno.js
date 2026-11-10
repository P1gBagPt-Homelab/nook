import { spawn, execSync } from "child_process";

async function isServerRunning() {
  try {
    const res = await fetch("http://localhost:8000/healthz", { signal: AbortSignal.timeout(1000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function run() {
  let devProcess = null;
  const running = await isServerRunning();

  if (!running) {
    console.log("Starting API server for Bruno smoke tests...");
    devProcess = spawn("npm run dev:api", {
      shell: true,
      stdio: "ignore",
    });

    // Wait up to 30s for server
    const start = Date.now();
    while (Date.now() - start < 30000) {
      if (await isServerRunning()) break;
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  try {
    execSync("cd bruno && npx bru run -r --env Local --bail", { stdio: "inherit", shell: true });
  } finally {
    if (devProcess) {
      if (process.platform === "win32") {
        try {
          execSync(`taskkill /pid ${devProcess.pid} /T /F`, { stdio: "ignore" });
        } catch {
          // ignore
        }
      } else {
        devProcess.kill();
      }
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
