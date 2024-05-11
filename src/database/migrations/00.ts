import { Kysely, type Migration } from "kysely";

export const migration00: Migration = {
  async up(db: Kysely<any>): Promise<void> {
    console.log("Upgrading database");
    await db.schema
      .createTable("document")
      .addColumn("id", "text", (col) => col.primaryKey())
      .addColumn("name", "text", (col) => col.notNull())
      .addColumn("description", "text", (col) => col.notNull())
      .addColumn("content", "text", (col) => col.notNull())
      .addColumn("data", "json")
      .execute();

    await db.schema
      .createTable("response")
      .addColumn("id", "text", (col) => col.primaryKey())
      .addColumn("projectId", "text", (col) => col.notNull())
      .addColumn("modelId", "text", (col) => col.notNull())
      .addColumn("error", "text")
      .execute();

    await db.schema
      .createTable("responseMessage")
      .addColumn("id", "text", (col) => col.primaryKey())
      .addColumn("responseId", "text", (col) => col.notNull())
      .addColumn("role", "text", (col) => col.notNull())
      .addColumn("content", "text", (col) => col.notNull())
      .execute();

    await db.schema
      .createTable("model")
      .addColumn("id", "text", (col) => col.primaryKey())
      .addColumn("serviceId", "text", (col) => col.notNull())
      .addColumn("name", "text", (col) => col.notNull())
      .addColumn("visible", "boolean", (col) => col.notNull())
      .execute();

    await db.schema
      .createTable("service")
      .addColumn("id", "text", (col) => col.primaryKey())
      .addColumn("name", "text", (col) => col.notNull())
      .addColumn("providerId", "text", (col) => col.notNull())
      .addColumn("baseURL", "text", (col) => col.notNull())
      .addColumn("apiKey", "text", (col) => col.notNull())
      .execute();

    await db.schema
      .createTable("project")
      .addColumn("id", "text", (col) => col.primaryKey())
      .addColumn("name", "text", (col) => col.notNull())
      .addColumn("prompt", "text", (col) => col.notNull())
      .execute();
  },

  async down(db: Kysely<any>): Promise<void> {
    await db.schema.dropTable("document").execute();
    await db.schema.dropTable("response").execute();
    await db.schema.dropTable("responseMessage").execute();
    await db.schema.dropTable("model").execute();
    await db.schema.dropTable("service").execute();
    await db.schema.dropTable("project").execute();
  },
};
