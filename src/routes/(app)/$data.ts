import { useDb } from "@/database/client";
import { asc, desc, eq, not } from "drizzle-orm";
import { chatTable, responseMessageTable, responseTable } from "@/database/schema";
import { nanoid } from "nanoid";
import { invalidate } from "$app/navigation";

export async function newChat() {
  const id = nanoid(10);
  await useDb().insert(chatTable).values({
    id: id,
    name: "Untitled",
    prompt: "",
  });
  await invalidate("view:chats");
  return id;
}

export async function removeChat(chatId: string) {
  // remove responses
  await useDb().delete(responseTable).where(eq(responseTable.chatId, chatId));
  // delete chat
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
      responses: {
        with: {
          messages: {
            orderBy: [asc(responseMessageTable.index)],
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
    for (const response of chat.responses) {
      const responseId = nanoid(10);
      await tx.insert(responseTable).values({
        id: responseId,
        chatId: newChatId,
        modelId: response.modelId,
        error: null,
      });
      let index = 0;
      for (const message of response.messages) {
        const responseMessageId = nanoid(10);
        await tx.insert(responseMessageTable).values({
          id: responseMessageId,
          index,
          responseId: responseId,
          role: message.role,
          content: message.content,
        });
        index += 1;
      }
    }
  });
  await invalidate("view:chats");
  return newChatId;
}
