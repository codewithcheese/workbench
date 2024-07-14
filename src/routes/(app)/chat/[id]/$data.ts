import {
  attachmentTable,
  type Chat,
  chatTable,
  documentTable,
  type InsertMessage,
  messageTable,
  modelTable,
  type Revision,
  revisionTable,
  useDb,
} from "@/database";
import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { invalidateModel } from "@/database/model";
import { sql } from "drizzle-orm/sql";
import type { RouteId } from "$lib/route";
import type { MessageAttachment, ChatMessage } from "$lib/chat-service.svelte";

export type ServicesView = Awaited<ReturnType<typeof loadServices>>;

export type RevisionView = NonNullable<Awaited<ReturnType<typeof getRevision>>>;

export type Tab = "chat" | "eval" | "revise";

export function isTab(tab: any): tab is Tab {
  return tab === "chat" || tab === "eval" || tab === "revise";
}

export function tabRouteId(tab: Tab): RouteId {
  return tab === "chat" ? `/chat/[id]` : `/chat/[id]/${tab}`;
}

export function loadServices() {
  return useDb().query.serviceTable.findMany({
    with: {
      models: true,
    },
  });
}

export function toChatMessage(message: RevisionView["messages"][number]): ChatMessage {
  return {
    ...message,
    role: message.role as ChatMessage["role"],
    createdAt: message.createdAt ? new Date(message.createdAt) : undefined,
    attachments: message.attachments.map((a) => {
      return {
        id: a.document.id,
        type: a.document.type,
        name: a.document.name,
        content: a.document.content,
        attributes: a.document.attributes,
      };
    }),
  };
}

export function getRevision(chatId: string, version: number) {
  return useDb().query.revisionTable.findFirst({
    where: and(eq(revisionTable.chatId, chatId), eq(revisionTable.version, version)),
    with: {
      messages: {
        with: {
          attachments: {
            with: {
              document: true,
            },
          },
        },
      },
    },
  });
}

export function getLatestRevision(chatId: string) {
  return useDb().query.revisionTable.findFirst({
    where: eq(revisionTable.chatId, chatId),
    with: {
      messages: {
        with: {
          attachments: {
            with: {
              document: true,
            },
          },
        },
      },
    },
    orderBy: [desc(revisionTable.version)],
  });
}

export function getModelService(modelId: string) {
  return useDb().query.modelTable.findFirst({
    where: eq(modelTable.id, modelId),
    with: {
      service: true,
    },
  });
}

export async function createRevision(chatId: string) {
  const revisionId = nanoid(10);
  await useDb()
    .insert(revisionTable)
    .values({
      id: revisionId,
      version: sql`(SELECT COUNT(id) + 1 FROM ${revisionTable} WHERE ${eq(revisionTable.chatId, chatId)})`,
      chatId,
      error: null,
      createdAt: new Date().toISOString(),
    })
    .execute();
  return getLatestRevision(chatId);
}

export async function updateChat(chatId: string, updates: Partial<Chat>) {
  console.log("updateChat", chatId, updates);
  const result = await useDb()
    .update(chatTable)
    .set({ ...updates })
    .where(eq(chatTable.id, chatId))
    .returning();
  console.log(result);
  await invalidateModel(chatTable, { id: chatId });
}

export async function interpolateDocuments(prompt: string) {
  const templateTagRegex = /\[\[(.*?)]]/g;
  const matches = prompt.match(templateTagRegex);
  if (!matches) {
    return prompt;
  }
  let interpolatedPrompt = prompt;
  for (const match of matches) {
    const docName = match.slice(2, -2);
    console.log("Replacing", docName);
    // Find the document with the name extracted from the tag
    const document = await useDb().query.documentTable.findFirst({
      where: eq(documentTable.name, docName),
    });
    if (!document) {
      throw new Error(`Document "${docName}" not found.`);
    }
    interpolatedPrompt = interpolatedPrompt.replaceAll(match, document.content);
  }
  return interpolatedPrompt;
}

export async function appendMessage(
  message: Omit<InsertMessage, "index" | "createdAt">,
  attachments: MessageAttachment[] = [],
) {
  try {
    return await useDb().transaction(async (tx) => {
      await tx
        .insert(messageTable)
        .values({
          id: message.id,
          revisionId: message.revisionId,
          role: message.role,
          content: message.content,
          index: sql`(SELECT COUNT(id) FROM ${messageTable} WHERE ${eq(messageTable.revisionId, message.revisionId)})`,
        })
        .execute();
      for (const attachment of attachments) {
        const documentId = attachment.id;
        await tx
          .insert(documentTable)
          .values({
            id: documentId,
            type: attachment.type,
            name: `Pasted ${new Date().toLocaleString()}`,
            description: "",
            content: attachment.content,
          })
          .execute();
        await tx.insert(attachmentTable).values({
          id: nanoid(10),
          documentId,
          messageId: message.id,
        });
      }
    });
  } catch (e) {
    console.error(e);
    throw e;
  }
}

export async function newRevision(chatId: string, messages: ChatMessage[]): Promise<Revision> {
  const revisionId = nanoid(10);
  await useDb().transaction(async (tx) => {
    await tx
      .insert(revisionTable)
      .values({
        id: revisionId,
        version: sql`(SELECT COUNT(id) + 1 FROM ${revisionTable} WHERE ${eq(revisionTable.chatId, chatId)})`,
        chatId,
        error: null,
      })
      .execute();
    for (const message of messages) {
      const newMessageId = nanoid(10);
      await tx
        .insert(messageTable)
        .values({
          id: newMessageId,
          revisionId,
          role: message.role,
          content: message.content,
          index: sql`(SELECT COUNT(id) FROM ${messageTable} WHERE ${eq(messageTable.revisionId, revisionId)})`,
        })
        .execute();
      for (const attachment of message.attachments) {
        await tx.insert(attachmentTable).values({
          id: nanoid(10),
          documentId: attachment.id,
          messageId: newMessageId,
        });
      }
    }
  });
  const revision = await useDb().query.revisionTable.findFirst({
    where: eq(revisionTable.id, revisionId),
  });
  return revision!;
}
