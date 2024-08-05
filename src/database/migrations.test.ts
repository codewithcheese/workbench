import {
  expect,
  describe,
  it,
  beforeAll,
  afterAll,
  vi,
  onTestFailed,
  beforeEach,
  afterEach,
} from "vitest";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { sql } from "drizzle-orm";
import { useDb } from "@/database/client";
import journal from "@/database/migrations/meta/_journal.json";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "@/database/schema";

describe("Migration Tests", () => {
  let sqlite: Database.Database;
  let db: BetterSQLite3Database<typeof schema>;

  /*
   * Test data for all tables. This data will be used to populate the database
   * after the initial migration and to verify the data integrity after subsequent migrations.
   */
  const testData = {
    projects: [
      {
        id: "project1",
        name: "Test Project 1",
        prompt: "Test prompt 1",
        createdAt: "2023-01-01T00:00:00Z",
      },
      {
        id: "project2",
        name: "Test Project 2",
        prompt: "Test prompt 2",
        createdAt: "2023-01-02T00:00:00Z",
      },
      {
        id: "project3",
        name: "Test Project 3",
        prompt: "Test prompt 3",
        createdAt: "2023-01-03T00:00:00Z",
      },
    ],
    services: [
      {
        id: "service1",
        name: "Test Service 1",
        providerId: "provider1",
        baseURL: "http://test1.com",
        apiKey: "testkey1",
        createdAt: "2023-01-01T00:00:00Z",
      },
      {
        id: "service2",
        name: "Test Service 2",
        providerId: "provider2",
        baseURL: "http://test2.com",
        apiKey: "testkey2",
        createdAt: "2023-01-02T00:00:00Z",
      },
    ],
    models: [
      {
        id: "model1",
        serviceId: "service1",
        name: "Test Model 1",
        visible: 1,
        createdAt: "2023-01-01T00:00:00Z",
      },
      {
        id: "model2",
        serviceId: "service1",
        name: "Test Model 2",
        visible: 0,
        createdAt: "2023-01-02T00:00:00Z",
      },
      {
        id: "model3",
        serviceId: "service2",
        name: "Test Model 3",
        visible: 1,
        createdAt: "2023-01-03T00:00:00Z",
      },
    ],
    responses: [
      {
        id: "response1",
        projectId: "project1",
        modelId: "model1",
        createdAt: "2023-01-01T00:00:00Z",
      },
      {
        id: "response2",
        projectId: "project1",
        modelId: "model2",
        createdAt: "2023-01-02T00:00:00Z",
      },
      {
        id: "response3",
        projectId: "project2",
        modelId: "model1",
        createdAt: "2023-01-03T00:00:00Z",
      },
      {
        id: "response4",
        projectId: "project3",
        modelId: "model3",
        createdAt: "2023-01-04T00:00:00Z",
      },
    ],
    responseMessages: [
      {
        id: "message1",
        index: 0,
        responseId: "response1",
        role: "user",
        content: "Test message 1",
        createdAt: "2023-01-01T00:00:00Z",
      },
      {
        id: "message2",
        index: 1,
        responseId: "response1",
        role: "assistant",
        content: "Test reply 1",
        createdAt: "2023-01-01T00:00:01Z",
      },
      {
        id: "message3",
        index: 0,
        responseId: "response2",
        role: "user",
        content: "Test message 2",
        createdAt: "2023-01-02T00:00:00Z",
      },
      {
        id: "message4",
        index: 0,
        responseId: "response3",
        role: "user",
        content: "Test message 3",
        createdAt: "2023-01-03T00:00:00Z",
      },
      {
        id: "message5",
        index: 1,
        responseId: "response3",
        role: "assistant",
        content: "Test reply 3",
        createdAt: "2023-01-03T00:00:01Z",
      },
    ],
    documents: [
      {
        id: "doc1",
        name: "Document 1",
        description: "Test doc",
        content: "Test content",
        createdAt: "2023-01-01T00:00:00Z",
      },
      {
        id: "doc2",
        name: "Pasted",
        description: "Pasted doc",
        content: "Pasted content",
        createdAt: "2023-01-02T00:00:00Z",
      },
    ],
  };

  let initialProjectCount: number;
  let initialServiceCount: number;
  let initialModelCount: number;
  let initialResponseCount: number;
  let initialMessageCount: number;
  let initialDocumentCount: number;

  function insertTestData() {
    for (const project of testData.projects) {
      db.run(
        sql`INSERT INTO project (id, name, prompt, createdAt) VALUES (${project.id}, ${project.name}, ${project.prompt}, ${project.createdAt})`,
      );
    }
    for (const service of testData.services) {
      db.run(
        sql`INSERT INTO service (id, name, providerId, baseURL, apiKey, createdAt) VALUES (${service.id}, ${service.name}, ${service.providerId}, ${service.baseURL}, ${service.apiKey}, ${service.createdAt})`,
      );
    }
    for (const model of testData.models) {
      db.run(
        sql`INSERT INTO model (id, serviceId, name, visible, createdAt) VALUES (${model.id}, ${model.serviceId}, ${model.name}, ${model.visible}, ${model.createdAt})`,
      );
    }
    for (const response of testData.responses) {
      db.run(
        sql`INSERT INTO response (id, projectId, modelId, createdAt) VALUES (${response.id}, ${response.projectId}, ${response.modelId}, ${response.createdAt})`,
      );
    }
    for (const message of testData.responseMessages) {
      db.run(
        sql`INSERT INTO responseMessage (id, "index", responseId, role, content, createdAt) VALUES (${message.id}, ${message.index}, ${message.responseId}, ${message.role}, ${message.content}, ${message.createdAt})`,
      );
    }
    for (const document of testData.documents) {
      db.run(
        sql`INSERT INTO document (id, name, description, content, createdAt) VALUES (${document.id}, ${document.name}, ${document.description}, ${document.content}, ${document.createdAt})`,
      );
    }
    /*
     * Verify that the initial data was inserted correctly.
     * This establishes a baseline for comparison after migrations.
     */
    initialProjectCount = db.get<{ count: number }>(
      sql`SELECT COUNT(*) as count FROM project`,
    ).count;
    initialServiceCount = db.get<{ count: number }>(
      sql`SELECT COUNT(*) as count FROM service`,
    ).count;
    initialModelCount = db.get<{ count: number }>(sql`SELECT COUNT(*) as count FROM model`).count;
    initialResponseCount = db.get<{ count: number }>(
      sql`SELECT COUNT(*) as count FROM response`,
    ).count;
    initialMessageCount = db.get<{ count: number }>(
      sql`SELECT COUNT(*) as count FROM responseMessage`,
    ).count;
    initialDocumentCount = db.get<{ count: number }>(
      sql`SELECT COUNT(*) as count FROM document`,
    ).count;

    expect(initialProjectCount).toBe(testData.projects.length);
    expect(initialServiceCount).toBe(testData.services.length);
    expect(initialModelCount).toBe(testData.models.length);
    expect(initialResponseCount).toBe(testData.responses.length);
    expect(initialMessageCount).toBe(testData.responseMessages.length);
    expect(initialDocumentCount).toBe(testData.documents.length);
  }

  async function applyMigrationsUpTo(targetMigration: string) {
    let isFirstMigration = true;
    for (const entry of journal.entries) {
      if (isFirstMigration) {
        await runMigration(entry.tag);
        insertTestData();
        isFirstMigration = false;
      } else {
        await runMigration(entry.tag);
      }
      if (entry.tag === targetMigration) {
        break;
      }
    }
  }

  vi.mock("@/database/client");

  beforeEach(async () => {
    sqlite = new Database(":memory:");
    db = drizzle(sqlite);
    vi.mocked(useDb).mockReturnValue(db);
  });

  afterEach(() => {
    sqlite.close();
    vi.resetAllMocks();
  });

  async function runMigration(migration: string) {
    const migrationSql = (await import(`@/database/migrations/${migration}.sql?raw`)).default;
    db.run(sql`PRAGMA foreign_keys = OFF;`);
    await Promise.all(
      migrationSql.split("--> statement-breakpoint").map((s: string) => db.run(sql.raw(s))),
    );
    db.run(sql`PRAGMA foreign_keys = ON;`);
  }

  it("0000_careful_smiling_tiger", async () => {
    await applyMigrationsUpTo("0000_careful_smiling_tiger");

    /*
     * Check for unique and other indexes after the first migration
     * This ensures that the initial schema is set up correctly with all necessary constraints
     */
    const documentNameUniqueIndex = db.get<{ name: string } | undefined>(
      sql`SELECT name FROM sqlite_master WHERE type='index' AND name='document_name_unique'`,
    );
    expect(documentNameUniqueIndex).toBeTruthy();

    const serviceNameUniqueIndex = db.get<{ name: string } | undefined>(
      sql`SELECT name FROM sqlite_master WHERE type='index' AND name='serviceName_unique'`,
    );
    expect(serviceNameUniqueIndex).toBeTruthy();
  });

  it("0001_nosy_earthquake", async () => {
    await applyMigrationsUpTo("0001_nosy_earthquake");

    /*
     * Verify data integrity after the second migration.
     * The record counts should remain the same as no data was added or removed.
     */
    const secondMigrationResponseCount = db.get<{ count: number }>(
      sql`SELECT COUNT(*) as count FROM response`,
    ).count;
    const secondMigrationMessageCount = db.get<{ count: number }>(
      sql`SELECT COUNT(*) as count FROM responseMessage`,
    ).count;
    const secondMigrationModelCount = db.get<{ count: number }>(
      sql`SELECT COUNT(*) as count FROM model`,
    ).count;

    expect(secondMigrationResponseCount).toBe(initialResponseCount);
    expect(secondMigrationMessageCount).toBe(initialMessageCount);
    expect(secondMigrationModelCount).toBe(initialModelCount);

    /*
     * Verify that the new indexes were created.
     * This is crucial for ensuring the migration successfully improved query performance.
     */
    const responseIndex = db.get<{ name: string } | undefined>(
      sql`SELECT name FROM sqlite_master WHERE type='index' AND name='projectId_idx'`,
    );
    const messageIndex = db.get<{ name: string } | undefined>(
      sql`SELECT name FROM sqlite_master WHERE type='index' AND name='responseId_idx'`,
    );
    const modelIndex = db.get<{ name: string } | undefined>(
      sql`SELECT name FROM sqlite_master WHERE type='index' AND name='serviceId_idx'`,
    );

    expect(responseIndex).toBeTruthy();
    expect(messageIndex).toBeTruthy();
    expect(modelIndex).toBeTruthy();

    /*
     * Check the structure of the new tables after the second migration
     * This verifies that the tables were recreated with the correct structure
     */
    const responseColumns = db.all<{ name: string; type: string }>(
      sql`PRAGMA table_info(response)`,
    );
    expect(responseColumns).toContainEqual(
      expect.objectContaining({ name: "error", type: "TEXT" }),
    );

    const responseMessageColumns = db.all<{ name: string; type: string }>(
      sql`PRAGMA table_info(responseMessage)`,
    );
    expect(responseMessageColumns).toContainEqual(
      expect.objectContaining({ name: "index", type: "INTEGER" }),
    );

    const modelColumns = db.all<{ name: string; type: string }>(sql`PRAGMA table_info(model)`);
    expect(modelColumns).toContainEqual(
      expect.objectContaining({ name: "visible", type: "INTEGER" }),
    );

    /*
     * Test the UNIQUE constraint on the model table
     * This ensures that the unique constraint on (serviceId, name) is working correctly
     */
    expect(() =>
      db.run(sql`
      INSERT INTO model (id, serviceId, name, visible, createdAt)
      VALUES ('model4', 'service1', 'Test Model 1', 1, '2023-01-04T00:00:00Z')
    `),
    ).toThrow();
  });

  it("0002_overjoyed_mordo", async () => {
    await applyMigrationsUpTo("0002_overjoyed_mordo");

    /*
     * Verify that the 'project' table was successfully renamed to 'chat'.
     * The count of records in 'chat' should match the original 'project' count.
     */
    const thirdMigrationChatCount = db.get<{ count: number }>(
      sql`SELECT COUNT(*) as count FROM chat`,
    ).count;
    expect(thirdMigrationChatCount).toBe(initialProjectCount);

    /*
     * Confirm that the 'project' table no longer exists.
     * This ensures the renaming was done correctly and didn't leave behind the old table.
     */
    const projectTableExists = db.get<{ name: string } | undefined>(
      sql`SELECT name FROM sqlite_master WHERE type='table' AND name='project'`,
    );
    expect(projectTableExists).toBeFalsy();

    /*
     * Verify that the 'response' table wasn't affected by the renaming.
     * Its record count should remain the same.
     */
    const thirdMigrationResponseCount = db.get<{ count: number }>(
      sql`SELECT COUNT(*) as count FROM response`,
    ).count;
    expect(thirdMigrationResponseCount).toBe(initialResponseCount);

    /*
     * Check that the 'response' table now has a 'chatId' column instead of 'projectId'.
     * This verifies that the foreign key was updated correctly.
     */
    const chatIdColumn = db.get<{ name: string; type: string } | undefined>(
      sql`PRAGMA table_info(response)`,
    );
    expect(chatIdColumn).toBeTruthy();
    expect(chatIdColumn?.type).toBe("TEXT");

    /*
     * Verify that the index on 'response' was updated to use 'chatId'.
     * This ensures that query performance is maintained after the schema change.
     */
    const chatIdIndex = db.get<{ name: string } | undefined>(
      sql`SELECT name FROM sqlite_master WHERE type='index' AND name='chatId_idx'`,
    );
    expect(chatIdIndex).toBeTruthy();

    /*
     * Verify that the data in the 'chat' table matches the original 'project' data.
     * This ensures that no data was lost or corrupted during the renaming process.
     */
    const chatData = db.all<{ id: string; name: string; prompt: string }>(
      sql`SELECT id, name, prompt FROM chat ORDER BY id`,
    );
    expect(chatData).toEqual(
      testData.projects.map(({ id, name, prompt }) => ({ id, name, prompt })),
    );
    /*
     * Verify that the 'response' table data is correct, with 'chatId' replacing 'projectId'.
     * This ensures that the foreign key relationships were properly updated.
     */
    const responseData = db.all<{ id: string; chatId: string; modelId: string }>(
      sql`SELECT id, chatId, modelId FROM response ORDER BY id`,
    );
    expect(responseData).toEqual(
      testData.responses.map(({ id, projectId: chatId, modelId }) => ({ id, chatId, modelId })),
    );

    /*
     * Verify that the 'responseMessage' table data remains unchanged.
     * This table wasn't directly affected by the migrations, so its data should be intact.
     */
    const messageData = db.all<{ id: string; responseId: string; role: string; content: string }>(
      sql`SELECT id, responseId, role, content FROM responseMessage ORDER BY id`,
    );
    expect(messageData).toEqual(
      testData.responseMessages.map(({ id, responseId, role, content }) => ({
        id,
        responseId,
        role,
        content,
      })),
    );

    /*
     * Test the ON DELETE CASCADE behavior introduced in the third migration.
     * This ensures that when a chat is deleted, its associated responses are also deleted.
     */
    await db.run(sql`DELETE FROM chat WHERE id = 'project1'`);
    const responseCount = db.get<{ count: number }>(
      sql`SELECT COUNT(*) as count FROM response WHERE chatId = 'project1'`,
    ).count;
    expect(responseCount).toBe(0);

    /*
     * Verify that the deletion of 'project1' didn't affect other chats' responses
     */
    const remainingResponseCount = db.get<{ count: number }>(
      sql`SELECT COUNT(*) as count FROM response`,
    ).count;
    expect(remainingResponseCount).toBe(initialResponseCount - 2); // 'project1' had 2 responses

    /*
     * Check that the responseMessages associated with the deleted responses are also removed
     * This tests the cascading delete behavior through multiple levels
     */
    const remainingMessageCount = db.get<{ count: number }>(
      sql`SELECT COUNT(*) as count FROM responseMessage`,
    ).count;
    expect(remainingMessageCount).toBe(initialMessageCount - 3); // 'project1' had 3 messages
  });

  it("0003_huge_nick_fury", async () => {
    await applyMigrationsUpTo("0003_huge_nick_fury");

    // Check for the creation of new tables
    const messageTable = db.get<{ name: string } | undefined>(
      sql`SELECT name FROM sqlite_master WHERE type='table' AND name='message'`,
    );
    expect(messageTable).toBeTruthy();

    const revisionTable = db.get<{ name: string } | undefined>(
      sql`SELECT name FROM sqlite_master WHERE type='table' AND name='revision'`,
    );
    expect(revisionTable).toBeTruthy();

    // Verify the creation of new indexes
    const messageIndex = db.get<{ name: string } | undefined>(
      sql`SELECT name FROM sqlite_master WHERE type='index' AND name='message_revisionId_idx'`,
    );
    expect(messageIndex).toBeTruthy();

    const revisionIndex = db.get<{ name: string } | undefined>(
      sql`SELECT name FROM sqlite_master WHERE type='index' AND name='revision_chatId_idx'`,
    );
    expect(revisionIndex).toBeTruthy();

    // Check that data has been migrated correctly
    const revisionCount = db.get<{ count: number }>(
      sql`SELECT COUNT(*) as count FROM revision`,
    ).count;
    expect(revisionCount).toBe(initialResponseCount);

    const messageCount = db.get<{ count: number }>(
      sql`SELECT COUNT(*) as count FROM message`,
    ).count;
    expect(messageCount).toBe(initialMessageCount);

    // Verify the structure of the new tables
    const revisionColumns = db.all<{ name: string; type: string }>(
      sql`PRAGMA table_info(revision)`,
    );
    expect(revisionColumns).toContainEqual(
      expect.objectContaining({ name: "version", type: "INTEGER" }),
    );
    expect(revisionColumns).toContainEqual(
      expect.objectContaining({ name: "chatId", type: "TEXT" }),
    );

    const messageColumns = db.all<{ name: string; type: string }>(sql`PRAGMA table_info(message)`);
    expect(messageColumns).toContainEqual(
      expect.objectContaining({ name: "revisionId", type: "TEXT" }),
    );
    expect(messageColumns).toContainEqual(expect.objectContaining({ name: "role", type: "TEXT" }));

    // Verify the content of migrated data
    const revisionData = db.all<{ id: string; version: number; chatId: string }>(
      sql`SELECT id, version, chatId FROM revision ORDER BY chatId, createdAt`,
    );

    // Sort testData.responses by createdAt to ensure correct ordering
    const sortedResponses = [...testData.responses].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    // Calculate expected versions
    const chatVersions = new Map<string, number>();
    const expectedRevisionData = sortedResponses.map(({ id, projectId: chatId }) => {
      const currentVersion = (chatVersions.get(chatId) || 0) + 1;
      chatVersions.set(chatId, currentVersion);
      return { id, version: currentVersion, chatId };
    });

    expect(revisionData).toEqual(expectedRevisionData);

    const messageData = db.all<{ id: string; revisionId: string; role: string; content: string }>(
      sql`SELECT id, revisionId, role, content FROM message ORDER BY id`,
    );
    expect(messageData).toEqual(
      testData.responseMessages.map(({ id, responseId: revisionId, role, content }) => ({
        id,
        revisionId,
        role,
        content,
      })),
    );

    // Test cascading delete behavior
    await db.run(sql`DELETE FROM chat WHERE id = 'project2'`);
    const remainingRevisionCount = db.get<{ count: number }>(
      sql`SELECT COUNT(*) as count FROM revision WHERE chatId = 'project2'`,
    ).count;
    expect(remainingRevisionCount).toBe(0);

    const remainingMessageCount = db.get<{ count: number }>(
      sql`SELECT COUNT(*) as count FROM message WHERE revisionId IN (SELECT id FROM revision WHERE chatId = 'project2')`,
    ).count;
    expect(remainingMessageCount).toBe(0);

    // Verify that the deletion didn't affect other chats' data
    const totalRemainingRevisionCount = db.get<{ count: number }>(
      sql`SELECT COUNT(*) as count FROM revision`,
    ).count;
    expect(totalRemainingRevisionCount).toBe(revisionCount - 1); // 'project2' had 1 response/revision

    const totalRemainingMessageCount = db.get<{ count: number }>(
      sql`SELECT COUNT(*) as count FROM message`,
    ).count;
    expect(totalRemainingMessageCount).toBe(messageCount - 2); // 'project2' had 2 messages
  });

  it("0004_skinny_machine_man", async () => {
    await applyMigrationsUpTo("0004_skinny_machine_man");

    // Verify that the 'response' table has been dropped
    const responseTable = db.get<{ name: string } | undefined>(
      sql`SELECT name FROM sqlite_master WHERE type='table' AND name='response'`,
    );
    expect(responseTable).toBeFalsy();

    // Verify that the 'responseMessage' table has been dropped
    const responseMessageTable = db.get<{ name: string } | undefined>(
      sql`SELECT name FROM sqlite_master WHERE type='table' AND name='responseMessage'`,
    );
    expect(responseMessageTable).toBeFalsy();

    // Verify that the 'revision' and 'message' tables still exist and contain the migrated data
    const revisionCount = db.get<{ count: number }>(
      sql`SELECT COUNT(*) as count FROM revision`,
    ).count;
    expect(revisionCount).toBe(initialResponseCount);

    const messageCount = db.get<{ count: number }>(
      sql`SELECT COUNT(*) as count FROM message`,
    ).count;
    expect(messageCount).toBe(initialMessageCount);

    // Verify that the data in the 'revision' and 'message' tables is still correct
    const revisionData = db.all<{ id: string; version: number; chatId: string }>(
      sql`SELECT id, version, chatId FROM revision ORDER BY chatId, createdAt`,
    );

    const chatVersions = new Map<string, number>();
    const expectedRevisionData = testData.responses
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map(({ id, projectId: chatId }) => {
        const currentVersion = (chatVersions.get(chatId) || 0) + 1;
        chatVersions.set(chatId, currentVersion);
        return { id, version: currentVersion, chatId };
      });

    expect(revisionData).toEqual(expectedRevisionData);

    const messageData = db.all<{ id: string; revisionId: string; role: string; content: string }>(
      sql`SELECT id, revisionId, role, content FROM message ORDER BY id`,
    );

    const expectedMessageData = testData.responseMessages.map(
      ({ id, responseId: revisionId, role, content }) => ({
        id,
        revisionId,
        role,
        content,
      }),
    );

    expect(messageData).toEqual(expectedMessageData);

    // Verify that the foreign key relationships are still intact
    await db.run(sql`DELETE FROM chat WHERE id = 'project1'`);
    const remainingRevisionCount = db.get<{ count: number }>(
      sql`SELECT COUNT(*) as count FROM revision WHERE chatId = 'project1'`,
    ).count;
    expect(remainingRevisionCount).toBe(0);

    const remainingMessageCount = db.get<{ count: number }>(
      sql`SELECT COUNT(*) as count FROM message WHERE revisionId IN (SELECT id FROM revision WHERE chatId = 'project1')`,
    ).count;
    expect(remainingMessageCount).toBe(0);

    // Final check on the total remaining data
    const finalRevisionCount = db.get<{ count: number }>(
      sql`SELECT COUNT(*) as count FROM revision`,
    ).count;
    expect(finalRevisionCount).toBe(revisionCount - 2); // 'project1' had 2 revisions

    const finalMessageCount = db.get<{ count: number }>(
      sql`SELECT COUNT(*) as count FROM message`,
    ).count;
    expect(finalMessageCount).toBe(messageCount - 3); // 'project1' had 3 messages
  });

  it("0005_careful_the_professor", async () => {
    await applyMigrationsUpTo("0005_careful_the_professor");

    // Verify that the 'attachment' table was created
    const attachmentTable = db.get<{ name: string } | undefined>(
      sql`SELECT name FROM sqlite_master WHERE type='table' AND name='attachment'`,
    );
    expect(attachmentTable).toBeTruthy();

    // Check the structure of the 'attachment' table
    const attachmentColumns = db.all<{ name: string; type: string }>(
      sql`PRAGMA table_info(attachment)`,
    );
    expect(attachmentColumns).toContainEqual(
      expect.objectContaining({
        name: "id",
        type: "TEXT",
      }),
    );
    expect(attachmentColumns).toContainEqual(
      expect.objectContaining({
        name: "messageId",
        type: "TEXT",
      }),
    );
    expect(attachmentColumns).toContainEqual(
      expect.objectContaining({
        name: "documentId",
        type: "TEXT",
      }),
    );
    expect(attachmentColumns).toContainEqual(
      expect.objectContaining({
        name: "createdAt",
        type: "TEXT",
      }),
    );

    // Verify that the 'type' column was added to the 'document' table
    const documentColumns = db.all<{ name: string; type: string }>(
      sql`PRAGMA table_info(document)`,
    );
    expect(documentColumns).toContainEqual(expect.objectContaining({ name: "type", type: "TEXT" }));

    // Check if the indexes were created
    const attachmentMessageIdIndex = db.get<{ name: string } | undefined>(
      sql`SELECT name FROM sqlite_master WHERE type='index' AND name='attachment_messageId_idx'`,
    );
    expect(attachmentMessageIdIndex).toBeTruthy();

    const messageDocumentUniqueIndex = db.get<{ name: string } | undefined>(
      sql`SELECT name FROM sqlite_master WHERE type='index' AND name='messageDocument_unique'`,
    );
    expect(messageDocumentUniqueIndex).toBeTruthy();

    // Test foreign key constraints
    const message = db.get<{ id: string }>(sql`SELECT id FROM message LIMIT 1`);
    const document = db.get<{ id: string }>(sql`SELECT id FROM document LIMIT 1`);

    if (message && document) {
      // Insert a valid attachment
      db.run(
        sql`INSERT INTO attachment (id, messageId, documentId) VALUES ('test1', ${message.id}, ${document.id})`,
      );

      // Attempt to insert an attachment with non-existent messageId (should fail)
      expect(() =>
        db.run(
          sql`INSERT INTO attachment (id, messageId, documentId) VALUES ('test2', 'non_existent', ${document.id})`,
        ),
      ).toThrow();

      // Attempt to insert an attachment with non-existent documentId (should fail)
      expect(() =>
        db.run(
          sql`INSERT INTO attachment (id, messageId, documentId) VALUES ('test3', ${message.id}, 'non_existent')`,
        ),
      ).toThrow();

      // Test cascade delete
      db.run(sql`DELETE FROM message WHERE id = ${message.id}`);
      const attachmentAfterDelete = db.get(
        sql`SELECT * FROM attachment WHERE messageId = ${message.id}`,
      );
      expect(attachmentAfterDelete).toBeFalsy();
    }
  });

  it("0006_opposite_sugar_man", async () => {
    await applyMigrationsUpTo("0006_opposite_sugar_man");

    // Verify that the 'attributes' column was added to the 'document' table
    const documentColumns = db.all<{ name: string; type: string }>(
      sql`PRAGMA table_info(document)`,
    );
    expect(documentColumns).toContainEqual(
      expect.objectContaining({ name: "attributes", type: "TEXT" }),
    );

    // Check if the default value is set correctly
    const document = db.get<{ attributes: string }>(sql`SELECT attributes FROM document LIMIT 1`);
    expect(document?.attributes).toBe("{}");

    // Test inserting a document with custom attributes
    db.run(
      sql`INSERT INTO document (id, name, type, description, content, attributes) VALUES ('test_doc', 'Test Document', 'document', 'Test description', 'Test content', '{"key": "value"}')`,
    );
    const insertedDocument = db.get<{ attributes: string }>(
      sql`SELECT attributes FROM document WHERE id = 'test_doc'`,
    );
    expect(insertedDocument?.attributes).toBe('{"key": "value"}');

    // Verify that existing documents have the default attributes value
    const existingDocuments = db.all<{ id: string; attributes: string }>(
      sql`SELECT id, attributes FROM document WHERE id != 'test_doc'`,
    );
    existingDocuments.forEach((doc) => {
      expect(doc.attributes).toBe("{}");
    });
  });

  it("0007_tidy_lilandra", async () => {
    await applyMigrationsUpTo("0007_tidy_lilandra");

    // Verify that the 'document_name_unique' index was dropped
    const documentNameUniqueIndex = db.get<{ name: string } | undefined>(
      sql`SELECT name FROM sqlite_master WHERE type='index' AND name='document_name_unique'`,
    );
    expect(documentNameUniqueIndex).toBeFalsy();

    // Test that we can now insert documents with the same name
    db.run(
      sql`INSERT INTO document (id, name, type, description, content) VALUES ('doc3', 'Same Name', 'document', 'Test description', 'Test content')`,
    );
    db.run(
      sql`INSERT INTO document (id, name, type, description, content) VALUES ('doc4', 'Same Name', 'document', 'Test description', 'Test content')`,
    );

    const documentsWithSameName = db.all<{ id: string }>(
      sql`SELECT id FROM document WHERE name = 'Same Name'`,
    );
    expect(documentsWithSameName.length).toBe(2);

    // Verify that other constraints and data remain intact
    const documentCount = db.get<{ count: number }>(
      sql`SELECT COUNT(*) as count FROM document`,
    ).count;
    expect(documentCount).toBe(initialDocumentCount + 2); // Initial count plus the two we just added
  });

  it("0008_parallel_grandmaster", async () => {
    await applyMigrationsUpTo("0008_parallel_grandmaster");

    // Verify that 'aiService' table was renamed to 'aiAccount'
    const aiAccountTable = db.get<{ name: string } | undefined>(
      sql`SELECT name FROM sqlite_master WHERE type='table' AND name='aiAccount'`,
    );
    expect(aiAccountTable).toBeTruthy();

    const aiServiceTable = db.get<{ name: string } | undefined>(
      sql`SELECT name FROM sqlite_master WHERE type='table' AND name='aiService'`,
    );
    expect(aiServiceTable).toBeFalsy();

    // Check that 'aiServiceId' column in 'model' table was renamed to 'aiAccountId'
    const modelColumns = db.all<{ name: string; type: string }>(sql`PRAGMA table_info(aiModel)`);
    expect(modelColumns).toContainEqual(
      expect.objectContaining({ name: "aiAccountId", type: "TEXT" }),
    );
    expect(modelColumns).not.toContainEqual(expect.objectContaining({ name: "aiServiceId" }));

    // Verify that 'providerId' column in 'aiAccount' table was renamed to 'aiServiceId'
    const aiAccountColumns = db.all<{ name: string; type: string }>(
      sql`PRAGMA table_info(aiAccount)`,
    );
    expect(aiAccountColumns).toContainEqual(
      expect.objectContaining({ name: "aiServiceId", type: "TEXT" }),
    );
    expect(aiAccountColumns).not.toContainEqual(expect.objectContaining({ name: "providerId" }));

    // Check that the new indexes were created
    const aiAccountIdIdx = db.get<{ name: string } | undefined>(
      sql`SELECT name FROM sqlite_master WHERE type='index' AND name='aiAccountId_idx'`,
    );
    expect(aiAccountIdIdx).toBeTruthy();

    const aiAccountIdUnique = db.get<{ name: string } | undefined>(
      sql`SELECT name FROM sqlite_master WHERE type='index' AND name='aiAccountId_unique'`,
    );
    expect(aiAccountIdUnique).toBeTruthy();

    // Verify that the old indexes were dropped
    const aiServiceIdIdx = db.get<{ name: string } | undefined>(
      sql`SELECT name FROM sqlite_master WHERE type='index' AND name='aiServiceId_idx'`,
    );
    expect(aiServiceIdIdx).toBeFalsy();

    const aiServiceNameUnique = db.get<{ name: string } | undefined>(
      sql`SELECT name FROM sqlite_master WHERE type='index' AND name='aiServiceName_unique'`,
    );
    expect(aiServiceNameUnique).toBeFalsy();

    // Verify that the data was migrated correctly
    const aiAccountCount = db.get<{ count: number }>(
      sql`SELECT COUNT(*) as count FROM aiAccount`,
    ).count;
    expect(aiAccountCount).toBe(initialServiceCount);

    const modelCount = db.get<{ count: number }>(sql`SELECT COUNT(*) as count FROM aiModel`).count;
    expect(modelCount).toBe(initialModelCount);

    // Verify the content of migrated data
    const aiAccountData = db.all<{ id: string; name: string; aiServiceId: string }>(
      sql`SELECT id, name, aiServiceId FROM aiAccount ORDER BY id`,
    );
    expect(aiAccountData).toEqual(
      testData.services.map(({ id, name, providerId: aiServiceId }) => ({ id, name, aiServiceId })),
    );

    const modelData = db.all<{ id: string; aiAccountId: string; name: string; visible: number }>(
      sql`SELECT id, aiAccountId, name, visible FROM aiModel ORDER BY id`,
    );
    expect(modelData).toEqual(
      testData.models.map(({ id, serviceId: aiAccountId, name, visible }) => ({
        id,
        aiAccountId,
        name,
        visible,
      })),
    );

    // Test the new foreign key constraint
    const aiAccount = db.get<{ id: string }>(sql`SELECT id FROM aiAccount LIMIT 1`);
    expect(aiAccount).toBeTruthy();

    // Insert a valid model
    db.run(
      sql`INSERT INTO aiModel (id, aiAccountId, name, visible) VALUES ('test_model', ${aiAccount.id}, 'Test Model', 1)`,
    );

    // Attempt to insert a model with non-existent aiAccountId (should fail)
    expect(() =>
      db.run(
        sql`INSERT INTO aiModel (id, aiAccountId, name, visible) VALUES ('invalid_model', 'non_existent', 'Invalid Model', 1)`,
      ),
    ).toThrow();

    // Test cascade delete
    db.run(sql`DELETE FROM aiAccount WHERE id = ${aiAccount.id}`);
    const modelAfterDelete = db.get(sql`SELECT * FROM aiModel WHERE aiAccountId = ${aiAccount.id}`);
    expect(modelAfterDelete).toBeFalsy();
  });

  it("0009_ancient_korath", async () => {
    await applyMigrationsUpTo("0009_ancient_korath");

    // Verify that the 'aiSdk' table was created
    const aiSdkTable = db.get<{ name: string } | undefined>(
      sql`SELECT name FROM sqlite_master WHERE type='table' AND name='aiSdk'`,
    );
    expect(aiSdkTable).toBeTruthy();

    // Verify that the 'aiService' table was created
    const aiServiceTable = db.get<{ name: string } | undefined>(
      sql`SELECT name FROM sqlite_master WHERE type='table' AND name='aiService'`,
    );
    expect(aiServiceTable).toBeTruthy();

    // Check the structure of the 'aiSdk' table
    const aiSdkColumns = db.all<{ name: string; type: string }>(sql`PRAGMA table_info(aiSdk)`);
    expect(aiSdkColumns).toContainEqual(expect.objectContaining({ name: "id", type: "TEXT" }));
    expect(aiSdkColumns).toContainEqual(expect.objectContaining({ name: "slug", type: "TEXT" }));
    expect(aiSdkColumns).toContainEqual(expect.objectContaining({ name: "name", type: "TEXT" }));

    // Check the structure of the 'aiService' table
    const aiServiceColumns = db.all<{ name: string; type: string }>(
      sql`PRAGMA table_info(aiService)`,
    );
    expect(aiServiceColumns).toContainEqual(expect.objectContaining({ name: "id", type: "TEXT" }));
    expect(aiServiceColumns).toContainEqual(
      expect.objectContaining({ name: "name", type: "TEXT" }),
    );
    expect(aiServiceColumns).toContainEqual(
      expect.objectContaining({ name: "aiSdkId", type: "TEXT" }),
    );
    expect(aiServiceColumns).toContainEqual(
      expect.objectContaining({ name: "baseURL", type: "TEXT" }),
    );
    expect(aiServiceColumns).toContainEqual(
      expect.objectContaining({ name: "createdAt", type: "TEXT" }),
    );

    // Verify that the initial data was inserted correctly
    const aiSdkCount = db.get<{ count: number }>(sql`SELECT COUNT(*) as count FROM aiSdk`).count;
    expect(aiSdkCount).toBe(11); // 11 SDKs were inserted

    const aiServiceCount = db.get<{ count: number }>(
      sql`SELECT COUNT(*) as count FROM aiService`,
    ).count;
    expect(aiServiceCount).toBe(11); // 11 services were inserted

    // Check some specific entries to ensure data integrity
    const openaiSdk = db.get<{ id: string; slug: string; name: string }>(
      sql`SELECT * FROM aiSdk WHERE id = 'openai'`,
    );
    expect(openaiSdk).toEqual({ id: "openai", slug: "openai", name: "OpenAI" });

    const azureService = db.get(sql`SELECT * FROM aiService WHERE id = 'azure'`);
    expect(azureService).toMatchObject({
      id: "azure",
      name: "Azure OpenAI",
      aiSdkId: "azure",
      baseURL: null,
    });

    // // Test unique constraint on aiSdk slug
    // expect(() =>
    //   db.run(sql`INSERT INTO aiSdk (id, slug, name) VALUES ('test', 'openai', 'Test SDK')`),
    // ).toThrow();

    // Verify that the aiAccount table still exists and maintains its relationship with aiService
    const aiAccountTable = db.get<{ name: string } | undefined>(
      sql`SELECT name FROM sqlite_master WHERE type='table' AND name='aiAccount'`,
    );
    expect(aiAccountTable).toBeTruthy();

    const aiAccountColumns = db.all<{ name: string; type: string }>(
      sql`PRAGMA table_info(aiAccount)`,
    );
    expect(aiAccountColumns).toContainEqual(
      expect.objectContaining({ name: "aiServiceId", type: "TEXT" }),
    );
  });

  it("0010_far_wiccan", async () => {
    await applyMigrationsUpTo("0010_far_wiccan");

    // Test unique constraint on aiSdk slug
    expect(() =>
      db.run(sql`INSERT INTO aiSdk (id, slug, name) VALUES ('test', 'openai', 'Test SDK')`),
    ).toThrow();
  });
});
