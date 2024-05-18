import { sqliteTable, text, int, primaryKey, index, unique } from "drizzle-orm/sqlite-core";
import { type InferSelectModel, relations } from "drizzle-orm";
import { sql } from "drizzle-orm/sql";

/**
 * Tables
 */

export const documentTable = sqliteTable("document", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  content: text("content").notNull(),
  // data: text("data").notNull(),
  createdAt: text("createdAt").default(sql`(CURRENT_TIMESTAMP)`),
});

export const responseTable = sqliteTable(
  "response",
  {
    id: text("id").primaryKey(),
    projectId: text("projectId")
      .notNull()
      .references(() => projectTable.id),
    modelId: text("modelId")
      .notNull()
      .references(() => modelTable.id),
    error: text("error"),
    createdAt: text("createdAt").default(sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => ({
    projectIdIdx: index("projectId_idx").on(table.projectId),
  }),
);

export const responseMessageTable = sqliteTable(
  "responseMessage",
  {
    id: text("id").primaryKey(),
    index: int("index").notNull(),
    responseId: text("responseId")
      .notNull()
      .references(() => responseTable.id),
    role: text("role").notNull(),
    content: text("content").notNull(),
    createdAt: text("createdAt").default(sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => ({
    responseIdIdx: index("responseId_idx").on(table.responseId),
  }),
);

export const modelTable = sqliteTable(
  "model",
  {
    id: text("id").notNull().primaryKey(),
    serviceId: text("serviceId")
      .notNull()
      .references(() => serviceTable.id),
    name: text("name").notNull(),
    visible: int("visible").notNull(),
    createdAt: text("createdAt").default(sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => ({
    serviceNameUnique: unique("serviceName_unique").on(table.serviceId, table.name),
    serviceIdx: index("serviceId_idx").on(table.serviceId),
  }),
);

export const serviceTable = sqliteTable("service", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  providerId: text("providerId").notNull(),
  baseURL: text("baseURL").notNull(),
  apiKey: text("apiKey").notNull(),
  createdAt: text("createdAt").default(sql`(CURRENT_TIMESTAMP)`),
});

export const projectTable = sqliteTable("project", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  prompt: text("prompt").notNull(),
  createdAt: text("createdAt").default(sql`(CURRENT_TIMESTAMP)`),
});

/**
 * Types
 */

export type Document = InferSelectModel<typeof documentTable>;
export type Response = InferSelectModel<typeof responseTable>;
export type ResponseMessage = InferSelectModel<typeof responseMessageTable>;
export type Model = InferSelectModel<typeof modelTable>;
export type Service = InferSelectModel<typeof serviceTable>;
export type Project = InferSelectModel<typeof projectTable>;

/**
 * Relations
 */

export const projectRelations = relations(projectTable, ({ many }) => ({
  responses: many(responseTable),
}));

export const responseRelations = relations(responseTable, ({ one, many }) => ({
  project: one(projectTable, {
    fields: [responseTable.projectId],
    references: [projectTable.id],
  }),
  model: one(modelTable, {
    fields: [responseTable.modelId],
    references: [modelTable.id],
  }),
  messages: many(responseMessageTable),
}));

export const modelRelations = relations(modelTable, ({ one }) => ({
  service: one(serviceTable, {
    fields: [modelTable.serviceId],
    references: [serviceTable.id],
  }),
}));

export const serviceRelations = relations(serviceTable, ({ many }) => ({
  models: many(modelTable),
}));

export const responseMessageRelations = relations(responseMessageTable, ({ one }) => ({
  response: one(responseTable, {
    fields: [responseMessageTable.responseId],
    references: [responseTable.id],
  }),
}));
