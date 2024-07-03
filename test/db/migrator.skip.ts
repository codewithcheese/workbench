import { runMigrations } from "../src/database/migrator";
import { describe, it } from "vitest";

describe("drizzle migrations", () => {
  it("should run migrations", async () => {
    await runMigrations();
  });
});
