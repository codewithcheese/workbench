import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadResponses, removeResponse, updateMessages } from "./$data";
import Database from "better-sqlite3";
import { type BetterSQLite3Database, drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/database/schema";
import { runMigrations } from "@/database/migrator";
import { eq } from "drizzle-orm";
import { invalidate } from "$app/navigation";
import { useDb } from "@/database";

vi.mock("nanoid");
vi.mock("$app/navigation");
vi.mock("@/database/client");

let sqlite: Database.Database;
let db: BetterSQLite3Database<typeof schema>;

beforeEach(async () => {
  // Set up database
  sqlite = new Database(":memory:");
  db = drizzle(sqlite, { schema });
  vi.mocked(useDb).mockReturnValue(db);

  await runMigrations(true);

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
    .insert(schema.chatTable)
    .values([{ id: "chat1", name: "Test Chat", prompt: "Test prompt" }]);

  await db
    .insert(schema.responseTable)
    .values([{ id: "response1", chatId: "chat1", modelId: "model1" }]);

  await db.insert(schema.responseMessageTable).values([
    { id: "message1", index: 0, responseId: "response1", role: "user", content: "Hello" },
    { id: "message2", index: 1, responseId: "response1", role: "assistant", content: "Hi there" },
  ]);
});

afterEach(() => {
  sqlite.close();
  vi.resetAllMocks();
});

describe("loadResponses", () => {
  it("should load responses for a given chat", async () => {
    const responses = await loadResponses("chat1");

    expect(responses).toHaveLength(1);
    expect(responses[0]).toEqual(
      expect.objectContaining({
        id: "response1",
        chatId: "chat1",
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

describe("updateMessages", () => {
  it("should update existing messages and add new ones", async () => {
    const newMessages = [
      { id: "message1", role: "user", content: "Hello", createdAt: new Date() },
      { id: "new-message2", role: "assistant", content: "Updated Hi there", createdAt: new Date() },
    ];

    // @ts-expect-error message type mismatch
    await updateMessages("response1", newMessages);

    const updatedMessages = await db.query.responseMessageTable.findMany({
      where: eq(schema.responseMessageTable.responseId, "response1"),
      orderBy: [schema.responseMessageTable.index],
    });

    expect(updatedMessages).toHaveLength(2);
    expect(updatedMessages[0].content).toBe("Hello");
    expect(updatedMessages[1].content).toBe("Updated Hi there");
    expect(invalidate).toHaveBeenCalledWith("view:responses");
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
