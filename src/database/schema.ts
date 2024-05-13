import { sqliteTable, text, int } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

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
  responseId: text("response_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
});

export const modelTable = sqliteTable("model", {
  id: text("id").primaryKey(),
  serviceId: text("serviceId").notNull(),
  name: text("name").notNull(),
  visible: int("visible").notNull(),
});

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

export const responseMessageRelations = relations(responseMessageTable, ({ one }) => ({
  response: one(responseTable, {
    fields: [responseMessageTable.responseId],
    references: [responseTable.id],
  }),
}));
