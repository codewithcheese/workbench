import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { interpolateDocuments, updateChat } from "./$data";
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
  }));

  vi.mock("svelte-french-toast", () => ({
    toast: {
      error: vi.fn(),
    },
  }));

  vi.mock("nanoid", () => ({
    nanoid: vi.fn(),
  }));

  // Mock the useDb function
  vi.mock("@/database/client", () => ({
    useDb: vi.fn(() => db),
  }));

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
    .values([{ id: "chat1", name: "Test Chat", prompt: "Test prompt with [[doc1]]" }]);

  await db.insert(schema.revisionTable).values([{ id: "revision1", version: 1, chatId: "chat1" }]);

  await db.insert(schema.messageTable).values([
    {
      id: "message1",
      index: 0,
      revisionId: "revision1",
      role: "user",
      content: "Original content",
    },
  ]);

  await db
    .insert(schema.documentTable)
    .values([{ id: "doc1", name: "doc1", description: "Test doc", content: "Test content" }]);
});

afterEach(() => {
  sqlite.close();
});

describe("updateChat", () => {
  it("should update a chat", async () => {
    const updatedChat = {
      id: "chat1",
      name: "Updated Chat",
      prompt: "Updated prompt",
      createdAt: new Date().toISOString(),
    };
    await updateChat(updatedChat.id, updatedChat);

    const chat = await db.query.chatTable.findFirst({
      where: eq(schema.chatTable.id, "chat1"),
    });

    expect(chat).toEqual(expect.objectContaining(updatedChat));
    expect(invalidate).toHaveBeenCalled();
  });
});

describe("interpolateDocuments", () => {
  it("should interpolate documents into the prompt", async () => {
    const result = await interpolateDocuments("This is a [[doc1]] test");
    expect(result).toBe("This is a Test content test");
  });

  it("should throw an error if document is not found", async () => {
    await expect(interpolateDocuments("This is a [[nonexistent]] test")).rejects.toThrow(
      'Document "nonexistent" not found.',
    );
  });
});
