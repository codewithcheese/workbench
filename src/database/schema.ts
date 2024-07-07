import { sqliteTable, text, int, primaryKey, index, unique } from "drizzle-orm/sqlite-core";
import { type InferInsertModel, type InferSelectModel, relations } from "drizzle-orm";
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
    chatId: text("chatId")
      .notNull()
      .references(() => chatTable.id, { onDelete: "cascade" }),
    modelId: text("modelId").notNull(),
    error: text("error"),
    createdAt: text("createdAt").default(sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => ({
    chatIdIdx: index("chatId_idx").on(table.chatId),
  }),
);

export const responseMessageTable = sqliteTable(
  "responseMessage",
  {
    id: text("id").primaryKey(),
    index: int("index").notNull(),
    responseId: text("responseId")
      .notNull()
      .references(() => responseTable.id, { onDelete: "cascade" }),
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
      .references(() => serviceTable.id, { onDelete: "cascade" }),
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

export const chatTable = sqliteTable("chat", {
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
export type InsertResponseMessage = InferInsertModel<typeof responseMessageTable>;
export type Model = InferSelectModel<typeof modelTable>;
export type Service = InferSelectModel<typeof serviceTable>;
export type Chat = InferSelectModel<typeof chatTable>;
// export type Eval = InferSelectModel<typeof evalTable>;

/**
 * Relations
 */

export const chatRelations = relations(chatTable, ({ many }) => ({
  responses: many(responseTable),
}));

export const responseRelations = relations(responseTable, ({ one, many }) => ({
  chat: one(chatTable, {
    fields: [responseTable.chatId],
    references: [chatTable.id],
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
