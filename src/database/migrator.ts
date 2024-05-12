import { driz } from "@/database/client";
import { sql } from "drizzle-orm/sql";
import { db } from "@/store.svelte";
import {
  documents,
  models,
  projects,
  responseMessages,
  responses,
  services,
} from "@/database/schema";

const migrations = ["0000_soft_maverick"];

export async function runMigrations() {
  const haveMigrationsTable = await driz.get(
    sql.raw("SELECT name FROM sqlite_master WHERE type='table' AND name='migrations';"),
  );
  if (!haveMigrationsTable) {
    await driz.run(sql.raw("CREATE TABLE `migrations` (`name` text PRIMARY KEY NOT NULL);"));
  }
  for (const migration of migrations) {
    await applyMigration(migration);
  }
}

async function migrateDatasets() {
  await driz.transaction(async (tx) => {
    for (const project of db.projects) {
      console.log("migrating project", project);
      await tx.insert(projects).values({
        id: project.id,
        name: project.name,
        prompt: project.prompt,
      });
      for (const response of db.responses.items.filter((r) => r.projectId === project.id)) {
        console.log("migrating response", response);
        await tx.insert(responses).values({
          id: response.id,
          projectId: response.projectId,
          modelId: response.modelId,
          error: response.error,
        });
        for (const message of db.messages.items.filter((m) => m.responseId === response.id)) {
          console.log("migrating message", message);
          await tx.insert(responseMessages).values({
            id: message.id,
            responseId: message.responseId,
            role: message.role,
            content: message.content,
          });
        }
      }
    }

    for (const service of db.services) {
      console.log("migrating service", service);
      await tx.insert(services).values({
        id: service.id,
        name: service.name,
        providerId: service.providerId,
        baseURL: service.baseURL,
        apiKey: service.apiKey,
      });
      for (const model of db.models.items.filter((m) => m.serviceId === service.id)) {
        console.log("migrating model", model);
        await tx.insert(models).values({
          id: model.id,
          serviceId: service.id,
          name: model.name || "",
          visible: model.visible ? 1 : 0,
        });
      }
    }

    for (const document of db.documents) {
      console.log("migrating document", document);
      await tx.insert(documents).values({
        id: document.id,
        name: document.name,
        description: document.description,
        content: document.content,
      });
    }
  });
}

async function applyMigration(migration: string) {
  // check if migration is already applied
  const checkQuery = `SELECT name FROM migrations WHERE name='${migration}'`;
  console.log("checkQuery", checkQuery);
  const hasMigration = await driz.get(sql.raw(checkQuery));
  console.log("hasMigration", hasMigration);
  if (!hasMigration) {
    await driz.transaction(async (tx) => {
      const migrationSql = (await import(`./migrations/${migration}.sql?raw`)).default;
      console.log("Applying migration", migration);
      await tx.run(sql.raw(migrationSql));
      // record migration in migrations table
      await tx.run(sql.raw(`INSERT INTO migrations (name) VALUES ('${migration}');`));
    });
    if (migration === "0000_soft_maverick") {
      await migrateDatasets();
    }
  }
}
