import { type ResponseMessage, responseMessageTable, responseTable, useDb } from "@/database";
import { asc, eq } from "drizzle-orm";
import { invalidate, invalidateAll } from "$app/navigation";

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

export async function updateMessages(responseId: string, newMessages: ResponseMessage[]) {
  const currentMessages = await useDb().query.responseMessageTable.findMany({
    where: eq(responseMessageTable.responseId, responseId),
    orderBy: [asc(responseMessageTable.index)],
  });
  let index = 0;
  await useDb().transaction(async (tx) => {
    for (const newMessage of newMessages) {
      const currentMessage = currentMessages[index];
      if (currentMessage && newMessage.id !== currentMessage.id) {
        // update required
        await tx.update(responseMessageTable).set({ ...newMessage, index });
      } else if (!currentMessage) {
        // new message
        await tx.insert(responseMessageTable).values({ ...newMessage, responseId, index });
      }
      index += 1;
    }
  });
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
