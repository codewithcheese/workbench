import { afterEach, beforeEach, describe, expect, it, vi, beforeAll, afterAll } from "vitest";
import { updateChat, updateResponsePrompt, interpolateDocuments, submitPrompt } from "./$data";
import Database from "better-sqlite3";
import { type BetterSQLite3Database, drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/database/schema";
import { runMigrations } from "@/database/migrator";
import { eq } from "drizzle-orm";
import { invalidate } from "$app/navigation";
import { toast } from "svelte-french-toast";
import { nanoid } from "nanoid";

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

  await db
    .insert(schema.responseTable)
    .values([{ id: "response1", chatId: "chat1", modelId: "model1" }]);

  await db.insert(schema.responseMessageTable).values([
    {
      id: "message1",
      index: 0,
      responseId: "response1",
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
    await updateChat(updatedChat);

    const chat = await db.query.chatTable.findFirst({
      where: eq(schema.chatTable.id, "chat1"),
    });

    expect(chat).toEqual(expect.objectContaining(updatedChat));
    expect(invalidate).toHaveBeenCalled();
  });
});

describe("updateResponsePrompt", () => {
  it("should update the response prompt", async () => {
    await updateResponsePrompt("response1");

    const message = await db.query.responseMessageTable.findFirst({
      where: eq(schema.responseMessageTable.responseId, "response1"),
    });

    expect(message?.content).toBe("Test prompt with Test content");
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("should show error toast if response is not found", async () => {
    await updateResponsePrompt("nonexistent");
    expect(toast.error).toHaveBeenCalledWith("Response not found");
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

describe("submitPrompt", () => {
  it("should submit a prompt and create a new response", async () => {
    vi.mocked(nanoid).mockReturnValueOnce("response2").mockReturnValueOnce("message2");

    const chat = {
      id: "chat1",
      name: "Test Chat",
      prompt: "Test prompt with [[doc1]]",
      createdAt: new Date().toISOString(),
    };
    await submitPrompt(chat, "model1");

    const response = await db.query.responseTable.findFirst({
      where: eq(schema.responseTable.id, "response2"),
    });
    expect(response).toBeDefined();

    const message = await db.query.responseMessageTable.findFirst({
      where: eq(schema.responseMessageTable.responseId, "response2"),
    });
    expect(message).toEqual(
      expect.objectContaining({
        responseId: "response2",
        role: "user",
        content: "Test prompt with Test content",
      }),
    );

    expect(invalidate).toHaveBeenCalledWith("view:responses");
  });

  it("should show error toast if no model is selected", async () => {
    const chat = {
      id: "chat1",
      name: "Test Chat",
      prompt: "Test prompt",
      createdAt: new Date().toISOString(),
    };
    await submitPrompt(chat, null);
    expect(toast.error).toHaveBeenCalledWith("No model selected");
  });

  it("should show error toast if selected model is not found", async () => {
    const chat = {
      id: "chat1",
      name: "Test Chat",
      prompt: "Test prompt",
      createdAt: new Date().toISOString(),
    };
    await submitPrompt(chat, "nonexistent");
    expect(toast.error).toHaveBeenCalledWith("Selected model not found");
  });
});
