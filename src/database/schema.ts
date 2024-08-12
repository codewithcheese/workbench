import { pgTable, text, integer, primaryKey, index, unique, jsonb } from "drizzle-orm/pg-core";
import { type InferInsertModel, type InferSelectModel, relations } from "drizzle-orm";
import { sql } from "drizzle-orm/sql";

/**
 * Tables
 */

export const documentTable = pgTable("document", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("document"),
  description: text("description").notNull(),
  content: text("content").notNull(),
  attributes: jsonb("attributes").notNull().default({}),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const revisionTable = pgTable(
  "revision",
  {
    id: text("id").primaryKey(),
    version: integer("version").notNull(),
    chatId: text("chat_id")
      .notNull()
      .references(() => chatTable.id, { onDelete: "cascade" }),
    error: text("error"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    chatIdIdx: index("revision_chat_id_idx").on(table.chatId),
  }),
);

export const messageTable = pgTable(
  "message",
  {
    id: text("id").primaryKey(),
    index: integer("index").notNull(),
    revisionId: text("revision_id")
      .notNull()
      .references(() => revisionTable.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    content: text("content").notNull(),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    revisionIdIdx: index("message_revision_id_idx").on(table.revisionId),
  }),
);

export const attachmentTable = pgTable(
  "attachment",
  {
    id: text("id").primaryKey(),
    messageId: text("message_id")
      .notNull()
      .references(() => messageTable.id, { onDelete: "cascade" }),
    documentId: text("document_id")
      .notNull()
      .references(() => documentTable.id, { onDelete: "cascade" }),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    messageDocumentUnique: unique("message_document_unique").on(table.messageId, table.documentId),
    messageIdIdx: index("attachment_message_id_idx").on(table.messageId),
  }),
);

export const modelTable = pgTable(
  "model",
  {
    id: text("id").notNull().primaryKey(),
    keyId: text("key_id")
      .notNull()
      .references(() => keyTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    visible: integer("visible").notNull(),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    keyId_unique: unique("account_id_unique").on(table.keyId, table.name),
    keyId_idx: index("account_id_idx").on(table.keyId),
  }),
);

export const keyTable = pgTable("key", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  serviceId: text("service_id").notNull(),
  baseURL: text("base_url"),
  apiKey: text("api_key").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const serviceTable = pgTable("service", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  sdkId: text("sdk_id").notNull(),
  baseURL: text("base_url").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const sdkTable = pgTable(
  "sdk",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    type: text("type").notNull().default("model"),
    name: text("name").notNull(),
    supported: integer("supported").notNull().default(1),
  },
  (table) => ({
    slugUnique: unique("slug_unique").on(table.slug),
  }),
);

export const chatTable = pgTable("chat", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  prompt: text("prompt").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

/**
 * Types
 */

export type Document = InferSelectModel<typeof documentTable>;
export type Revision = InferSelectModel<typeof revisionTable>;
export type Message = InferSelectModel<typeof messageTable>;
export type InsertMessage = InferInsertModel<typeof messageTable>;
export type Model = InferSelectModel<typeof modelTable>;
export type Key = InferSelectModel<typeof keyTable>;
export type Service = InferSelectModel<typeof serviceTable>;
export type Sdk = InferSelectModel<typeof sdkTable>;
export type Chat = InferSelectModel<typeof chatTable>;
// export type Eval = InferSelectModel<typeof evalTable>;

/**
 * Relations
 */

export const chatRelations = relations(chatTable, ({ many }) => ({
  revisions: many(revisionTable),
}));

export const modelRelations = relations(modelTable, ({ one }) => ({
  key: one(keyTable, {
    fields: [modelTable.keyId],
    references: [keyTable.id],
  }),
}));

export const keyRelations = relations(keyTable, ({ many, one }) => ({
  models: many(modelTable),
  service: one(serviceTable, {
    fields: [keyTable.serviceId],
    references: [serviceTable.id],
  }),
}));

export const serviceRelations = relations(serviceTable, ({ many, one }) => ({
  accounts: many(keyTable),
  sdk: one(sdkTable, {
    fields: [serviceTable.sdkId],
    references: [sdkTable.id],
  }),
}));

export const sdkRelations = relations(sdkTable, ({ many }) => ({
  service: many(serviceTable),
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
