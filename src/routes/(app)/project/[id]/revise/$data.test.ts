import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadResponses, removeResponse } from "./$data";
import Database from "better-sqlite3";
import { type BetterSQLite3Database, drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/database/schema";
import { runMigrations } from "@/database/migrator";
import { eq } from "drizzle-orm";
import { invalidate } from "$app/navigation";

let sqlite: Database.Database;
let db: BetterSQLite3Database<typeof schema>;

beforeEach(async () => {
  // Set up database
  sqlite = new Database(":memory:");
  db = drizzle(sqlite, { schema });

  // Set up mocks
  vi.mock("$app/navigation", () => ({
    invalidate: vi.fn(),
    invalidateAll: vi.fn(),
  }));

  vi.mock("nanoid", () => ({
    nanoid: vi.fn(),
  }));

  // Mock the useDb function
  vi.mock("@/database/client", () => ({
    useDb: vi.fn(() => db),
  }));

  await runMigrations();

  // Insert test data
  await db.insert(schema.serviceTable).values([
    {
      id: "service1",
      name: "Test Service",
      providerId: "provider1",
      baseURL: "https://api.test.com",
      apiKey: "test-api-key",
    },
  ]);

  await db
    .insert(schema.modelTable)
    .values([{ id: "model1", serviceId: "service1", name: "Test Model", visible: 1 }]);

  await db
    .insert(schema.projectTable)
    .values([{ id: "project1", name: "Test Project", prompt: "Test prompt" }]);

  await db
    .insert(schema.responseTable)
    .values([{ id: "response1", projectId: "project1", modelId: "model1" }]);

  await db.insert(schema.responseMessageTable).values([
    { id: "message1", index: 0, responseId: "response1", role: "user", content: "Hello" },
    { id: "message2", index: 1, responseId: "response1", role: "assistant", content: "Hi there" },
  ]);
});

afterEach(() => {
  sqlite.close();
  vi.restoreAllMocks();
});

describe("loadResponses", () => {
  it("should load responses for a given project", async () => {
    const responses = await loadResponses("project1");

    expect(responses).toHaveLength(1);
    expect(responses[0]).toEqual(
      expect.objectContaining({
        id: "response1",
        projectId: "project1",
        modelId: "model1",
      }),
    );
    expect(responses[0].messages).toHaveLength(2);
    expect(responses[0].model).toBeDefined();
    expect(responses[0].model.service).toBeDefined();
  });

  it("should return an empty array if no responses are found", async () => {
    const responses = await loadResponses("nonexistent");
    expect(responses).toHaveLength(0);
  });
});

describe("removeResponse", () => {
  it("should remove a response and its messages", async () => {
    await removeResponse("response1");

    const response = await db.query.responseTable.findFirst({
      where: eq(schema.responseTable.id, "response1"),
    });
    expect(response).toBeUndefined();

    const messages = await db.query.responseMessageTable.findMany({
      where: eq(schema.responseMessageTable.responseId, "response1"),
    });
    expect(messages).toHaveLength(0);

    expect(invalidate).toHaveBeenCalledWith("view:responses");
  });
});
