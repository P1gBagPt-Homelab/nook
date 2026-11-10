import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

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
