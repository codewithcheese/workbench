import { type ResponseMessage, responseMessageTable, responseTable, useDb } from "@/database";
import { asc, eq } from "drizzle-orm";
import { invalidate, invalidateAll } from "$app/navigation";
import { type Message } from "ai";

export type ResponsesView = Awaited<ReturnType<typeof loadResponses>>;

export function loadResponses(projectId: string) {
  return useDb().query.responseTable.findMany({
    with: {
      messages: true,
      model: {
        with: {
          service: true,
        },
      },
    },
    where: eq(responseTable.projectId, projectId),
  });
}

export async function updateMessages(responseId: string, newMessages: Message[]) {
  console.log(
    "updateMessages",
    responseId,
    newMessages.map((m) => $state.snapshot(m)),
  );
  newMessages = newMessages.map((m) => $state.snapshot(m));
  const currentMessages = await useDb().query.responseMessageTable.findMany({
    where: eq(responseMessageTable.responseId, responseId),
    orderBy: [asc(responseMessageTable.index)],
  });

  await useDb().transaction(async (tx) => {
    let index = 0;
    for (const newMessage of newMessages) {
      const currentMessage = currentMessages[index];
      if (currentMessage && newMessage.id !== currentMessage.id) {
        // update required
        await tx
          .update(responseMessageTable)
          .set({ ...newMessage, createdAt: newMessage.createdAt?.toISOString(), index })
          .where(eq(responseMessageTable.id, currentMessage.id));
      } else if (!currentMessage) {
        // new message
        await tx.insert(responseMessageTable).values({
          ...newMessage,
          createdAt: newMessage.createdAt?.toISOString(),
          responseId,
          index,
        });
      }
      index += 1;
    }
  });
  await invalidate("view:responses");
}

export async function removeResponse(responseId: string) {
  console.time("removeMessages");
  await useDb().transaction(async (tx) => {
    await tx.delete(responseMessageTable).where(eq(responseMessageTable.responseId, responseId));
    await tx.delete(responseTable).where(eq(responseTable.id, responseId));
  });
  console.timeEnd("removeMessages");
  await invalidate("view:responses");
}
