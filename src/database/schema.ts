import { sqliteTable, text, int, primaryKey } from "drizzle-orm/sqlite-core";
import { type InferSelectModel, relations } from "drizzle-orm";

/**
 * Tables
 */

export const documentTable = sqliteTable("document", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  content: text("content").notNull(),
  // data: text("data").notNull(),
});

export const responseTable = sqliteTable("response", {
  id: text("id").primaryKey(),
  projectId: text("projectId").notNull(),
  modelId: text("modelId").notNull(),
  error: text("error"),
});

export const responseMessageTable = sqliteTable("responseMessage", {
  id: text("id").primaryKey(),
  index: int("index").notNull(),
  responseId: text("responseId").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
});

export const modelTable = sqliteTable(
  "model",
  {
    id: text("id").notNull(),
    serviceId: text("serviceId").notNull(),
    name: text("name").notNull(),
    visible: int("visible").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id, table.serviceId] }),
  }),
);

export const serviceTable = sqliteTable("service", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  providerId: text("providerId").notNull(),
  baseURL: text("baseURL").notNull(),
  apiKey: text("apiKey").notNull(),
});

export const projectTable = sqliteTable("project", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  prompt: text("prompt").notNull(),
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
