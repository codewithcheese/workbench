import "dotenv/config";
import type { Config } from "drizzle-kit";

export default {
  dialect: "postgresql",
  schema: "./src/database/schema.ts",
  out: "./src/database/migrations",
  verbose: true,
  strict: true,
  dbCredentials: {
    url: "postgresql://myuser:mypassword@localhost:5434/mydb",
  },
} satisfies Config;
