import dotenv from "dotenv";
import path from "path";
import fs from "fs";

for (const envPath of [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../../.env"),
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../../../.env"),
]) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

import { buildServer } from "./server";

async function main() {
  const app = await buildServer();
  const port = Number(process.env.PORT) || 8000;
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`🚀 Nook API running at http://localhost:${port}`);
  console.log(`📖 Scalar Docs at http://localhost:${port}/docs`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
