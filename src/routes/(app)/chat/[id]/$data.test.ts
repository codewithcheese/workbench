import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  interpolateDocuments,
  updateChat,
  loadServices,
  getRevision,
  getLatestRevision,
  getModelService,
  createRevision,
  appendMessages,
  createRevision,
  isTab,
  tabRouteId,
} from "./$data";
import Database from "better-sqlite3";
import { type BetterSQLite3Database, drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/database/schema";
import { runMigrations } from "@/database/migrator";
import { and, eq } from "drizzle-orm";
import { invalidate } from "$app/navigation";
import { nanoid } from "nanoid";
import type { ChatMessage } from "$lib/chat-service.svelte";

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
    nanoid: vi.fn(() => "mocked-nanoid"),
  }));

  // Mock the useDb function
  vi.mock("@/database/client", () => ({
    useDb: vi.fn(() => db),
  }));

  vi.mock("@/database/model", () => ({
    invalidateModel: vi.fn(),
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

  await db.insert(schema.revisionTable).values([
    { id: "revision1", version: 1, chatId: "chat1" },
    { id: "revision2", version: 2, chatId: "chat1" },
  ]);

  await db.insert(schema.messageTable).values([
    {
      id: "message1",
      index: 0,
      revisionId: "revision1",
      role: "user",
      content: "Original content",
    },
    {
      id: "message2",
      index: 1,
      revisionId: "revision2",
      role: "assistant",
      content: "Response content",
    },
  ]);

  await db
    .insert(schema.documentTable)
    .values([{ id: "doc1", name: "doc1", description: "Test doc", content: "Test content" }]);

  await db.insert(schema.attachmentTable).values([
    {
      id: "attachment1",
      messageId: "message1",
      documentId: "doc1",
    },
  ]);
});

afterEach(() => {
  sqlite.close();
  vi.clearAllMocks();
});

describe("updateChat", () => {
  it("should update a chat", async () => {
    const updatedChat = {
      id: "chat1",
      name: "Updated Chat",
      prompt: "Updated prompt",
    };
    await updateChat(updatedChat.id, updatedChat);

    const chat = await db.query.chatTable.findFirst({
      where: eq(schema.chatTable.id, "chat1"),
    });

    expect(chat).toEqual(expect.objectContaining(updatedChat));
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

describe("loadServices", () => {
  it("should load services with their models", async () => {
    const services = await loadServices();
    expect(services).toHaveLength(1);
    expect(services[0]).toMatchObject({
      id: "service1",
      name: "Test Service",
      models: [{ id: "model1", name: "Test Model" }],
    });
  });
});

describe("getRevision", () => {
  it("should get a specific revision", async () => {
    const revision = await getRevision("chat1", 1);
    expect(revision).toMatchObject({
      id: "revision1",
      version: 1,
      chatId: "chat1",
      messages: [
        {
          id: "message1",
          content: "Original content",
          attachments: [{ id: "attachment1", documentId: "doc1", document: { id: "doc1" } }],
        },
      ],
    });
  });
});

describe("getLatestRevision", () => {
  it("should get the latest revision", async () => {
    const revision = await getLatestRevision("chat1");
    expect(revision).toMatchObject({
      id: "revision2",
      version: 2,
      chatId: "chat1",
      messages: [{ id: "message2", content: "Response content" }],
    });
  });
});

describe("getModelService", () => {
  it("should get a model with its service", async () => {
    const modelService = await getModelService("model1");
    expect(modelService).toMatchObject({
      id: "model1",
      name: "Test Model",
      service: { id: "service1", name: "Test Service" },
    });
  });
});

describe("createRevision", () => {
  it("should create a new revision", async () => {
    const newRevision = await createRevision("chat1");
    expect(newRevision).toMatchObject({
      chatId: "chat1",
      version: 3,
      id: "mocked-nanoid",
    });
  });
});

describe("appendMessage", () => {
  it("should append a message to a revision", async () => {
    const message = {
      id: "new-message",
      role: "user",
      content: "New message content",
      attachments: [],
    };
    await appendMessages("revision2", [message]);

    const messages = await db.query.messageTable.findMany({
      where: eq(schema.messageTable.revisionId, "revision2"),
    });
    expect(messages).toHaveLength(2);
    expect(messages[1]).toMatchObject({
      id: "new-message",
      role: "user",
      content: "New message content",
      index: 1,
    });
  });

  // todo
  it("should append attachments to the message");
});

describe("newRevision", () => {
  it("should create a new revision with messages", async () => {
    vi.mocked(nanoid)
      .mockReturnValueOnce("mocked-nanoid")
      .mockReturnValueOnce("message-1")
      .mockReturnValueOnce("message-2");
    const messages: ChatMessage[] = [
      { id: "new-message1", role: "user", content: "New user message", attachments: [] },
      { id: "new-message2", role: "assistant", content: "New assistant message", attachments: [] },
    ];
    const revision = await createRevision("chat1", messages);

    expect(revision).toMatchObject({
      chatId: "chat1",
      version: 3,
      id: "mocked-nanoid",
    });

    const newMessages = await db.query.messageTable.findMany({
      where: eq(schema.messageTable.revisionId, "mocked-nanoid"),
    });
    expect(newMessages).toHaveLength(2);
    expect(newMessages[0]).toMatchObject({
      role: "user",
      content: "New user message",
      index: 0,
    });
    expect(newMessages[1]).toMatchObject({
      role: "assistant",
      content: "New assistant message",
      index: 1,
    });
  });
});

describe("isTab", () => {
  it("should return true for valid tab values", () => {
    expect(isTab("chat")).toBe(true);
    expect(isTab("eval")).toBe(true);
    expect(isTab("revise")).toBe(true);
  });

  it("should return false for invalid tab values", () => {
    expect(isTab("invalid")).toBe(false);
    expect(isTab(123)).toBe(false);
    expect(isTab(null)).toBe(false);
  });
});

describe("tabRouteId", () => {
  it("should return correct route ID for each tab", () => {
    expect(tabRouteId("chat")).toBe("/chat/[id]");
    expect(tabRouteId("eval")).toBe("/chat/[id]/eval");
    expect(tabRouteId("revise")).toBe("/chat/[id]/revise");
  });
});
