import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { duplicateChat, newChat, removeChat } from "./$data";
import { drizzle } from "drizzle-orm/pglite";
import { nanoid } from "nanoid";
import * as schema from "@/database/schema";
import { chatTable, messageTable, revisionTable } from "@/database/schema";
import { runMigrations } from "@/database/migrator";
import { eq } from "drizzle-orm";
import { invalidate } from "$app/navigation";
import { sql } from "drizzle-orm/sql";
import { useDb } from "@/database";
import { PGlite } from "@electric-sql/pglite";
import type { PgliteDatabase } from "drizzle-orm/pglite";

describe("(app)/$data", () => {
  vi.mock("@/database/client");
  vi.mock("$app/navigation");
  vi.mock("nanoid");

  let pglite: PGlite;
  let db: PgliteDatabase<typeof schema>;

  beforeAll(async () => {
    pglite = new PGlite();
    db = drizzle(pglite, { schema });
  });

  beforeEach(async () => {
    vi.mocked(useDb).mockReturnValue(db);

    await runMigrations(true);

    await db.delete(schema.messageTable);
    await db.delete(schema.revisionTable);
    await db.delete(schema.chatTable);
    await db.delete(schema.modelTable);
    await db.delete(schema.keyTable);

    // Insert dummy data
    await db.insert(schema.sdkTable).values([{ id: "sdk1", name: "Test SDK", slug: "test-sdk" }]);
    await db
      .insert(schema.serviceTable)
      .values([
        { id: "service1", name: "Test Service", sdkId: "sdk1", baseURL: "https://api.test.com" },
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

    await db.insert(schema.chatTable).values([
      { id: "chat1", name: "Chat 1", prompt: "Prompt 1" },
      { id: "chat2", name: "Chat 2", prompt: "Prompt 2" },
    ]);

    await db.insert(schema.revisionTable).values([
      { id: "chat1-revision1", version: 1, chatId: "chat1" },
      { id: "chat2-revision1", version: 1, chatId: "chat2" },
    ]);

    await db.insert(schema.messageTable).values([
      { id: "message1", index: 0, revisionId: "chat1-revision1", role: "user", content: "Hello" },
      {
        id: "message2",
        index: 1,
        revisionId: "chat1-revision1",
        role: "assistant",
        content: "Hi there",
      },
      {
        id: "message3",
        index: 0,
        revisionId: "chat2-revision1",
        role: "user",
        content: "How are you?",
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
    vi.resetAllMocks();
  });

  describe("newChat", () => {
    it("should create a new chat", async () => {
      vi.mocked(nanoid).mockReturnValueOnce("newChatId").mockReturnValueOnce("newRevisionId");

      const newChatId = await newChat();
      expect(newChatId).toBe("newChatId");

      const chat = await db.query.chatTable.findFirst({
        where: eq(chatTable.id, newChatId),
      });
      expect(chat).toEqual({
        id: "newChatId",
        name: "Untitled",
        prompt: "",
        createdAt: expect.any(String),
      });
    });
  });

  describe("removeChat", () => {
    it("should remove a chat and its responses", async () => {
      const nextChatId = await removeChat("chat1");
      expect(nextChatId).toBe("chat2");

      const removedChat = await db.query.chatTable.findFirst({
        where: eq(chatTable.id, "chat1"),
      });
      expect(removedChat).toBeUndefined();

      const removedResponses = await db.query.revisionTable.findMany({
        where: eq(revisionTable.chatId, "chat1"),
      });
      expect(removedResponses).toHaveLength(0);

      const removedMessages = await db.query.messageTable.findMany({
        where: eq(messageTable.revisionId, "chat1-revision1"),
      });
      expect(removedMessages).toHaveLength(0);

      expect(vi.mocked(invalidate)).toHaveBeenCalledWith("view:chats");
    });

    it("should create a new chat if no chats remain", async () => {
      vi.mocked(nanoid).mockReturnValueOnce("newChatId").mockReturnValueOnce("newRevisionId");
      await db.delete(schema.chatTable);

      const nextChatId = await removeChat("non-existent-chat");
      expect(nextChatId).toBe("newChatId");

      const newChat = await db.query.chatTable.findFirst({
        where: eq(chatTable.id, "newChatId"),
      });
      expect(newChat).toBeDefined();
    });
  });

  describe("duplicateChat", () => {
    it("should duplicate a chat and its associated data", async () => {
      vi.mocked(nanoid)
        .mockReturnValueOnce("newChatId")
        .mockReturnValueOnce("newRevisionId")
        .mockReturnValueOnce("newMessageId");

      const newChatId = await duplicateChat("chat2");
      expect(newChatId).toBe("newChatId");

      const duplicatedChat = await db.query.chatTable.findFirst({
        where: eq(chatTable.id, "newChatId"),
        with: {
          revisions: {
            with: {
              messages: true,
            },
          },
        },
      });

      expect(duplicatedChat).toEqual({
        id: "newChatId",
        name: "Chat 2 copy",
        prompt: "Prompt 2",
        createdAt: expect.any(String),
        revisions: [
          {
            id: "newRevisionId",
            version: 1,
            chatId: "newChatId",
            error: null,
            createdAt: expect.any(String),
            messages: [
              {
                id: expect.any(String),
                index: 0,
                revisionId: "newRevisionId",
                role: "user",
                content: "How are you?",
                createdAt: expect.any(String),
              },
            ],
          },
        ],
      });

      expect(vi.mocked(invalidate)).toHaveBeenCalledWith("view:chats");
    });

    it("should throw an error if the chat to duplicate is not found", async () => {
      await expect(duplicateChat("non-existent-chat")).rejects.toThrow(
        "Chat non-existent-chat not found",
      );
    });
  });
});
