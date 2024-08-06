import { useDb } from "@/database/client";
import { asc, desc, eq, not } from "drizzle-orm";
import { chatTable, revisionTable, messageTable } from "@/database/schema";
import { nanoid } from "nanoid";
import { invalidate } from "$app/navigation";

export async function newChat() {
  const chatId = nanoid(10);
  await useDb().transaction(async (tx) => {
    await tx.insert(chatTable).values({
      id: chatId,
      name: "Untitled",
      prompt: "",
    });
    await tx.insert(revisionTable).values({
      id: nanoid(10),
      version: 1,
      chatId: chatId,
    });
  });
  return chatId;
}

export async function removeChat(chatId: string) {
  await useDb().delete(chatTable).where(eq(chatTable.id, chatId));
  // find next chat
  const nextChat = await useDb().query.chatTable.findFirst({
    where: not(eq(chatTable.id, chatId)),
    orderBy: [desc(chatTable.createdAt)],
  });
  let nextId: string;
  if (nextChat) {
    // next chat exists, use it
    nextId = nextChat.id;
  } else {
    // no next chat, create new chat
    nextId = await newChat();
  }
  await invalidate("view:chats");
  return nextId;
}

export async function duplicateChat(id: string) {
  const chat = await useDb().query.chatTable.findFirst({
    where: eq(chatTable.id, id),
    with: {
      revisions: {
        with: {
          messages: {
            orderBy: [asc(messageTable.index)],
          },
        },
      },
    },
  });
  if (!chat) {
    throw new Error(`Chat ${id} not found`);
  }
  const newChatId = nanoid(10);
  await useDb().transaction(async (tx) => {
    await tx.insert(chatTable).values({
      id: newChatId,
      name: `${chat.name} copy`,
      prompt: chat.prompt,
    });
    for (const revision of chat.revisions) {
      const newRevisionId = nanoid(10);
      await tx.insert(revisionTable).values({ ...revision, id: newRevisionId, chatId: newChatId });
      let index = 0;
      for (const message of revision.messages) {
        const newMessageId = nanoid(10);
        await tx
          .insert(messageTable)
          .values({ ...message, id: newMessageId, revisionId: newRevisionId });
        index += 1;
      }
    }
  });
  await invalidate("view:chats");
  return newChatId;
}
