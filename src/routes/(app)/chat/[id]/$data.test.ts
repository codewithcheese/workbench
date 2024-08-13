import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  appendMessages,
  createRevision,
  getKeys,
  getLatestRevision,
  getModelKey,
  getRevision,
  interpolateDocuments,
  isTab,
  tabRouteId,
  updateChat,
} from "./$data";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "@/database/schema";
import { runMigrations } from "@/database/migrator";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { ChatMessage } from "$lib/chat-service.svelte";
import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm/sql";

let pglite: PGlite;
let db: PgliteDatabase<typeof schema>;

beforeAll(async () => {
  pglite = new PGlite();
  db = drizzle(pglite, { schema });
});

beforeEach(async () => {
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
  await db.insert(schema.sdkTable).values([
    {
      id: "sdk1",
      name: "Test SDK",
      slug: "test-sdk",
    },
  ]);

  await db.insert(schema.serviceTable).values([
    {
      id: "service1",
      name: "Test Service",
      sdkId: "sdk1",
      baseURL: "https://api.test.com",
    },
  ]);

  await db.insert(schema.keyTable).values([
    {
      id: "key1",
      name: "Test Key",
      serviceId: "service1",
      baseURL: "https://api.test.com",
      apiKey: "test-api-key",
    },
  ]);

  await db
    .insert(schema.modelTable)
    .values([{ id: "model1", keyId: "key1", name: "Test Model", visible: 1 }]);

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

afterEach(async () => {
  // pglite is slowish to start for each test
  // instead drop all the tables
  await db.execute(sql`DO $$ 
    DECLARE 
        r RECORD;
    BEGIN
        -- Disable all triggers
        EXECUTE 'SET session_replication_role = replica';
        
        -- Drop all tables in the current schema
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
            EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
        
        -- Re-enable triggers
        EXECUTE 'SET session_replication_role = DEFAULT';
    END $$;
    `);

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
    const keys = await getKeys();
    expect(keys).toHaveLength(1);
    expect(keys[0]).toMatchObject({
      id: "key1",
      name: "Test Key",
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
    const modelKey = await getModelKey("model1");
    expect(modelKey).toMatchObject({
      id: "model1",
      name: "Test Model",
      key: { id: "key1", name: "Test Key" },
    });
  });
});

describe("createRevision", () => {
  it("should create a new revision", async () => {
    vi.mocked(nanoid).mockReturnValueOnce("created-revision-id");
    const newRevision = await createRevision("chat1");
    expect(newRevision).toMatchObject({
      chatId: "chat1",
      version: 3,
      id: "created-revision-id",
    });
  });
});

describe("appendMessage", () => {
  it("should append a message to a revision", async () => {
    const message = {
      id: "new-message",
      role: "user" as const,
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
      .mockReturnValueOnce("revision-with-messages-id")
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
      id: "revision-with-messages-id",
    });

    const newMessages = await db.query.messageTable.findMany({
      where: eq(schema.messageTable.revisionId, "revision-with-messages-id"),
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
