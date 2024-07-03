import { afterEach, beforeEach, describe, expect, it, vi, onTestFailed } from "vitest";
import { duplicateProject, newProject, removeProject } from "./$data";
import Database from "better-sqlite3";
import { type BetterSQLite3Database, drizzle } from "drizzle-orm/better-sqlite3";
import { nanoid } from "nanoid";
import * as schema from "@/database/schema";
import { projectTable, responseMessageTable, responseTable } from "@/database/schema";
import { runMigrations } from "@/database/migrator";
import { eq } from "drizzle-orm";
import { invalidate } from "$app/navigation";
import { sql } from "drizzle-orm/sql";

let sqlite: Database.Database;
let db: BetterSQLite3Database<typeof schema>;

// Apply migrations
beforeEach(async () => {
  // Create an in-memory SQLite database
  sqlite = new Database(":memory:");
  db = drizzle(sqlite, { schema });

  // Mock the useDb function
  vi.mock("@/database/client", () => ({
    useDb: vi.fn(() => db),
  }));

  // Mock the invalidate function
  vi.mock("$app/navigation", () => ({
    invalidate: vi.fn(),
  }));

  db.run(sql.raw("PRAGMA foreign_keys=off;"));

  await runMigrations();

  db.run(sql.raw("PRAGMA foreign_keys=on;"));

  await db.delete(schema.responseMessageTable);
  await db.delete(schema.responseTable);
  await db.delete(schema.projectTable);
  await db.delete(schema.modelTable);
  await db.delete(schema.serviceTable);

  // Insert dummy data
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

  await db.insert(schema.projectTable).values([
    { id: "project1", name: "Project 1", prompt: "Prompt 1" },
    { id: "project2", name: "Project 2", prompt: "Prompt 2" },
  ]);

  await db.insert(schema.responseTable).values([
    { id: "response1", projectId: "project1", modelId: "model1" },
    { id: "response2", projectId: "project2", modelId: "model1" },
  ]);

  await db.insert(schema.responseMessageTable).values([
    { id: "message1", index: 0, responseId: "response1", role: "user", content: "Hello" },
    { id: "message2", index: 1, responseId: "response1", role: "assistant", content: "Hi there" },
    { id: "message3", index: 0, responseId: "response2", role: "user", content: "How are you?" },
  ]);
});

afterEach(() => {
  sqlite.close();
});

describe("newProject", () => {
  it("should create a new project", async () => {
    vi.mock("nanoid", () => ({
      nanoid: vi.fn(() => "newProjectId"),
    }));

    const newProjectId = await newProject();

    expect(newProjectId).toBe("newProjectId");

    const project = await db.query.projectTable.findFirst({
      where: eq(projectTable.id, newProjectId),
    });

    expect(project).toEqual({
      id: "newProjectId",
      name: "Untitled",
      prompt: "",
      createdAt: expect.any(String),
    });

    expect(vi.mocked(invalidate)).toHaveBeenCalledWith("view:projects");
  });
});

describe("removeProject", () => {
  it("should remove a project and its responses", async () => {
    const nextProjectId = await removeProject("project1");

    expect(nextProjectId).toBe("project2");

    const removedProject = await db.query.projectTable.findFirst({
      where: eq(projectTable.id, "project1"),
    });
    expect(removedProject).toBeUndefined();

    const removedResponses = await db.query.responseTable.findMany({
      where: eq(responseTable.projectId, "project1"),
    });
    expect(removedResponses).toHaveLength(0);

    const removedMessages = await db.query.responseMessageTable.findMany({
      where: eq(responseMessageTable.responseId, "response1"),
    });
    expect(removedMessages).toHaveLength(0);

    expect(vi.mocked(invalidate)).toHaveBeenCalledWith("view:projects");
  });

  it("should create a new project if no projects are left", async () => {
    await db.delete(schema.projectTable);
    vi.mock("nanoid", () => ({
      nanoid: vi.fn(() => "newProjectId"),
    }));

    const nextProjectId = await removeProject("non-existent-project");

    expect(nextProjectId).toBe("newProjectId");

    const newProject = await db.query.projectTable.findFirst({
      where: eq(projectTable.id, "newProjectId"),
    });
    expect(newProject).toBeDefined();
  });
});

describe("duplicateProject", () => {
  it("should duplicate a project and its associated data", async () => {
    vi.mocked(nanoid).mockReturnValueOnce("newProjectId").mockReturnValueOnce("newResponseId");

    const newProjectId = await duplicateProject("project2");

    expect(newProjectId).toBe("newProjectId");

    const duplicatedProject = await db.query.projectTable.findFirst({
      where: eq(projectTable.id, "newProjectId"),
      with: {
        responses: {
          with: {
            messages: true,
          },
        },
      },
    });

    expect(duplicatedProject).toEqual({
      id: "newProjectId",
      name: "Project 2 copy",
      prompt: "Prompt 2",
      createdAt: expect.any(String),
      responses: [
        {
          id: "newResponseId",
          projectId: "newProjectId",
          modelId: "model1",
          error: null,
          createdAt: expect.any(String),
          messages: [
            {
              id: expect.any(String),
              index: 0,
              responseId: "newResponseId",
              role: "user",
              content: "How are you?",
              createdAt: expect.any(String),
            },
          ],
        },
      ],
    });

    expect(vi.mocked(invalidate)).toHaveBeenCalledWith("view:projects");
  });

  it("should throw an error if the project to duplicate is not found", async () => {
    await expect(duplicateProject("non-existent-project")).rejects.toThrow("Project not found");
  });
});
