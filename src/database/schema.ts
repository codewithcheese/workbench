import { sqliteTable, text, int } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const documents = sqliteTable("document", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  content: text("content").notNull(),
  // data: text("data").notNull(),
});

export const responses = sqliteTable("response", {
  id: text("id").primaryKey(),
  projectId: text("projectId").notNull(),
  modelId: text("modelId").notNull(),
  error: text("error"),
});

export const responseMessages = sqliteTable("responseMessage", {
  id: text("id").primaryKey(),
  responseId: text("response_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
});

export const models = sqliteTable("model", {
  id: text("id").primaryKey(),
  serviceId: text("serviceId").notNull(),
  name: text("name").notNull(),
  visible: int("visible").notNull(),
});

export const services = sqliteTable("service", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  providerId: text("providerId").notNull(),
  baseURL: text("baseURL").notNull(),
  apiKey: text("apiKey").notNull(),
});

export const projects = sqliteTable("project", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  prompt: text("prompt").notNull(),
});

export const responsesRelations = relations(responses, ({ one, many }) => ({
  project: one(projects, {
    fields: [responses.projectId],
    references: [projects.id],
  }),
  model: one(models, {
    fields: [responses.modelId],
    references: [models.id],
  }),
  message: many(responseMessages),
}));

export const modelsRelations = relations(models, ({ one }) => ({
  service: one(services, {
    fields: [models.serviceId],
    references: [services.id],
  }),
}));

export const responseMessagesRelations = relations(responseMessages, ({ one }) => ({
  response: one(responses, {
    fields: [responseMessages.responseId],
    references: [responses.id],
  }),
}));
