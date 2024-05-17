import { sql } from "drizzle-orm/sql";
import {
  documentTable,
  modelTable,
  projectTable,
  responseMessageTable,
  responseTable,
  serviceTable,
} from "@/database/schema";
import journal from "./migrations/meta/_journal.json";
import { useDb } from "@/database/client";
import { db } from "$lib/store.svelte";

export async function runMigrations() {
  const haveMigrationsTable = await useDb().get(
    sql.raw("SELECT name FROM sqlite_master WHERE type='table' AND name='migrations';"),
  );
  if (!haveMigrationsTable) {
    await useDb().run(sql.raw("CREATE TABLE `migrations` (`name` text PRIMARY KEY NOT NULL);"));
  }
  for (const entry of journal.entries) {
    await applyMigration(entry.idx, entry.tag);
  }
}

async function migrateDatasets() {
  await useDb().transaction(async (tx) => {
    for (const project of db.projects) {
      console.log("Migrating project", project);
      await tx.insert(projectTable).values({
        id: project.id,
        name: project.name,
        prompt: project.prompt,
      });
      for (const response of db.responses.items.filter((r) => r.projectId === project.id)) {
        console.log("Migrating response", response);
        await tx.insert(responseTable).values({
          id: response.id,
          projectId: response.projectId,
          modelId: response.modelId,
          error: response.error,
        });
        let index = 0;
        for (const message of db.messages.items.filter((m) => m.responseId === response.id)) {
          console.log("Migrating message", message);
          await tx.insert(responseMessageTable).values({
            id: message.id,
            index,
            responseId: message.responseId,
            role: message.role,
            content: message.content,
          });
          index += 1;
        }
      }
    }

    for (const service of db.services) {
      console.log("migrating service", service);
      await tx.insert(serviceTable).values({
        id: service.id,
        name: service.name,
        providerId: service.providerId,
        baseURL: service.baseURL,
        apiKey: service.apiKey,
      });
      for (const model of db.models.items.filter((m) => m.serviceId === service.id)) {
        console.log("migrating model", model);
        await tx.insert(modelTable).values({
          id: model.id,
          serviceId: service.id,
          name: model.name || "",
          visible: model.visible ? 1 : 0,
        });
      }
    }

    for (const document of db.documents) {
      console.log("migrating document", document);
      await tx.insert(documentTable).values({
        id: document.id,
        name: document.name,
        description: document.description,
        content: document.content,
      });
    }
  });
}

async function applyMigration(idx: number, migration: string) {
  // check if migration is already applied
  const checkQuery = `SELECT name FROM migrations WHERE name='${migration}'`;
  console.log("checkQuery", checkQuery);
  const hasMigration = await useDb().get(sql.raw(checkQuery));
  console.log("hasMigration", hasMigration);
  if (!hasMigration) {
    await useDb().transaction(async (tx) => {
      const migrationSql = (await import(`./migrations/${migration}.sql?raw`)).default;
      console.log("Applying migration", migration);
      await tx.run(sql.raw(migrationSql));
      // record migration in migrations table
      await tx.run(sql.raw(`INSERT INTO migrations (name) VALUES ('${migration}');`));
    });
    if (idx === 0) {
      await migrateDatasets();
    }
  }
}
