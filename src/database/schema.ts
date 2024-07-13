import { sqliteTable, text, int, primaryKey, index, unique } from "drizzle-orm/sqlite-core";
import { type InferInsertModel, type InferSelectModel, relations } from "drizzle-orm";
import { sql } from "drizzle-orm/sql";

/**
 * Tables
 */

export const documentTable = sqliteTable("document", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: text("type").notNull().default("document"),
  description: text("description").notNull(),
  content: text("content").notNull(),
  attributes: text("attributes", { mode: "json" })
    .$type<Record<string, any>>()
    .notNull()
    .default({}),
  // data: text("data").notNull(),
  createdAt: text("createdAt").default(sql`(CURRENT_TIMESTAMP)`),
});

export const revisionTable = sqliteTable(
  "revision",
  {
    id: text("id").primaryKey(),
    version: int("version").notNull(),
    chatId: text("chatId")
      .notNull()
      .references(() => chatTable.id, { onDelete: "cascade" }),
    error: text("error"),
    createdAt: text("createdAt").default(sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => ({
    chatIdIdx: index("revision_chatId_idx").on(table.chatId),
  }),
);

export const messageTable = sqliteTable(
  "message",
  {
    id: text("id").primaryKey(),
    index: int("index").notNull(),
    revisionId: text("revisionId")
      .notNull()
      .references(() => revisionTable.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    content: text("content").notNull(),
    // attachments: text("attachments", { mode: "json" })
    //   .$type<{ documentId: string }[]>()
    //   .default([]),
    createdAt: text("createdAt").default(sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => ({
    revisionIdIdx: index("message_revisionId_idx").on(table.revisionId),
  }),
);

export const attachmentTable = sqliteTable(
  "attachment",
  {
    id: text("id").primaryKey(),
    messageId: text("messageId")
      .notNull()
      .references(() => messageTable.id, { onDelete: "cascade" }),
    documentId: text("documentId")
      .notNull()
      .references(() => documentTable.id, { onDelete: "cascade" }),
    createdAt: text("createdAt").default(sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => ({
    messageDocumentUnique: unique("messageDocument_unique").on(table.messageId, table.documentId),
    messageIdIdx: index("attachment_messageId_idx").on(table.messageId),
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
export type Revision = InferSelectModel<typeof revisionTable>;
export type Message = InferSelectModel<typeof messageTable>;
export type InsertMessage = InferInsertModel<typeof messageTable>;
export type Model = InferSelectModel<typeof modelTable>;
export type Service = InferSelectModel<typeof serviceTable>;
export type Chat = InferSelectModel<typeof chatTable>;
// export type Eval = InferSelectModel<typeof evalTable>;

/**
 * Relations
 */

export const chatRelations = relations(chatTable, ({ many }) => ({
  revisions: many(revisionTable),
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

export const revisionRelations = relations(revisionTable, ({ one, many }) => ({
  chat: one(chatTable, {
    fields: [revisionTable.chatId],
    references: [chatTable.id],
  }),
  messages: many(messageTable),
}));

export const messageRelations = relations(messageTable, ({ one, many }) => ({
  revision: one(revisionTable, {
    fields: [messageTable.revisionId],
    references: [revisionTable.id],
  }),
  attachments: many(attachmentTable),
}));

export const attachmentRelations = relations(attachmentTable, ({ one, many }) => ({
  message: one(messageTable, {
    fields: [attachmentTable.messageId],
    references: [messageTable.id],
  }),
  document: one(documentTable, {
    fields: [attachmentTable.documentId],
    references: [documentTable.id],
  }),
}));
