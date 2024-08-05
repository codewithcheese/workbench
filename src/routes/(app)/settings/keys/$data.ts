import { z } from "zod";
import { invalidateModel, type Key, keyTable, type Model, modelTable, useDb } from "@/database";
import { and, eq, notInArray } from "drizzle-orm";
import { invalidate } from "$app/navigation";
import { nanoid } from "nanoid";
import type { SQLiteTransaction } from "drizzle-orm/sqlite-core";

export const formSchema = z.object({
  serviceId: z.string().min(1, { message: "Service is required" }),
  name: z.string().min(1, { message: "Name is required" }),
  apiKey: z.string().min(1, { message: "API Key is required" }),
  baseURL: z.string().nullable(),
});

export async function refreshModels(
  tx: SQLiteTransaction<any, any, any, any>,
  key: Key,
  models: any[],
) {
  await tx.delete(modelTable).where(
    and(
      eq(modelTable.keyId, key.id),
      notInArray(
        modelTable.name,
        models.map((m) => m.name),
      ),
    ),
  );
  for (const model of models) {
    await tx
      .insert(modelTable)
      .values({ id: nanoid(10), name: model.name, visible: 1, keyId: key.id })
      .onConflictDoNothing({
        target: [modelTable.name, modelTable.keyId],
      });
  }
}

export async function toggleVisible(key: Key, model: Model) {
  await useDb()
    .update(modelTable)
    .set({ visible: model.visible ? 0 : 1 })
    .where(and(eq(modelTable.id, model.id), eq(modelTable.keyId, key.id)));
  await invalidateModel(keyTable, key);
  await invalidateModel(modelTable, model);
}

export async function toggleAllVisible(key: Key, visible: 1 | 0) {
  console.time("toggleAllVisible");
  await useDb().update(modelTable).set({ visible }).where(eq(modelTable.keyId, key.id));
  console.timeEnd("toggleAllVisible");
  await invalidateModel(keyTable, key);
  await invalidate("view:key");
}
