import { z } from "zod";
import { invalidateModel, type Model, modelTable, type Key, keyTable, useDb } from "@/database";
import type { Provider } from "$lib/providers";
import { and, asc, eq, notInArray } from "drizzle-orm";
import { invalidate } from "$app/navigation";
import { nanoid } from "nanoid";

export type ServicesView = Awaited<ReturnType<typeof loadServices>>;

export const formSchema = z.object({
  serviceId: z.string().min(1, { message: "Service is required" }),
  name: z.string().min(1, { message: "Name is required" }),
  apiKey: z.string().min(1, { message: "API Key is required" }),
  baseURL: z.string().nullable(),
});

export async function loadServices() {
  return useDb().query.keyTable.findMany({
    with: {
      models: true,
    },
  });
}

export async function addService(provider: Provider) {
  const newId = nanoid(10);
  const result = await useDb()
    .insert(keyTable)
    .values({
      id: newId,
      name: "",
      providerId: provider.id,
      baseURL: provider.defaultBaseURL,
      apiKey: "",
    })
    .returning();
  if (result.length < 1) {
    throw Error("Failed to add service");
  }
  await invalidate("view:services");
  return result[0];
}

export async function deleteService(service: Key) {
  await useDb().transaction(async (tx) => {
    await tx.delete(modelTable).where(eq(modelTable.serviceId, service.id));
    await tx.delete(keyTable).where(eq(keyTable.id, service.id));
  });
  await invalidateModel(keyTable, service);
}

export async function updateService(service: Key) {
  console.time("updateService");
  await useDb()
    .update(keyTable)
    .set({ ...service })
    .where(eq(keyTable.id, service.id));
  console.timeEnd("updateService");
  await invalidateModel(keyTable, service);
}

export async function replaceModels(service: Key, newModels: any[]) {
  console.time("replaceModels");
  await useDb().transaction(async (tx) => {
    // remove models that no longer exist
    await tx.delete(modelTable).where(
      and(
        eq(modelTable.serviceId, service.id),
        notInArray(
          modelTable.name,
          newModels.map((m) => m.name),
        ),
      ),
    );
    console.log("newModels", newModels);
    for (const model of newModels) {
      await tx
        .insert(modelTable)
        .values({ id: nanoid(10), name: model.name, visible: 1, serviceId: service.id })
        .onConflictDoNothing({
          target: [modelTable.name, modelTable.serviceId],
        });
    }
  });
  console.timeEnd("replaceModels");
  await invalidateModel(keyTable, service);
}

export async function toggleVisible(service: Key, model: Model) {
  await useDb()
    .update(modelTable)
    .set({ visible: model.visible ? 0 : 1 })
    .where(and(eq(modelTable.id, model.id), eq(modelTable.serviceId, service.id)));
  await invalidateModel(keyTable, service);
  await invalidateModel(modelTable, model);
}

export async function toggleAllVisible(service: Key, visible: 1 | 0) {
  console.time("toggleAllVisible");
  await useDb().update(modelTable).set({ visible }).where(eq(modelTable.serviceId, service.id));
  console.timeEnd("toggleAllVisible");
  await invalidateModel(keyTable, service);
  await invalidate("view:chat");
}
