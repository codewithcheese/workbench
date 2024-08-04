import { z } from "zod";
import {
  invalidateModel,
  type Model,
  aiModelTable,
  type Service,
  aiAccountTable,
  useDb,
} from "@/database";
import type { Provider } from "$lib/providers";
import { and, asc, eq, notInArray } from "drizzle-orm";
import { invalidate } from "$app/navigation";
import { nanoid } from "nanoid";

export type ServicesView = Awaited<ReturnType<typeof loadServices>>;

export const formSchema = z.object({
  aiServiceId: z.string().min(1, { message: "AI Service is required" }),
  name: z.string().min(1, { message: "Name is required" }),
  apiKey: z.string().min(1, { message: "API Key is required" }),
  baseURL: z.string().nullable(),
});

export async function loadServices() {
  return useDb().query.aiAccountTable.findMany({
    with: {
      models: true,
    },
  });
}

export async function addService(provider: Provider) {
  const newId = nanoid(10);
  const result = await useDb()
    .insert(aiAccountTable)
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

export async function deleteService(service: Service) {
  await useDb().transaction(async (tx) => {
    await tx.delete(aiModelTable).where(eq(aiModelTable.serviceId, service.id));
    await tx.delete(aiAccountTable).where(eq(aiAccountTable.id, service.id));
  });
  await invalidateModel(aiAccountTable, service);
}

export async function updateService(service: Service) {
  console.time("updateService");
  await useDb()
    .update(aiAccountTable)
    .set({ ...service })
    .where(eq(aiAccountTable.id, service.id));
  console.timeEnd("updateService");
  await invalidateModel(aiAccountTable, service);
}

export async function replaceModels(service: Service, newModels: any[]) {
  console.time("replaceModels");
  await useDb().transaction(async (tx) => {
    // remove models that no longer exist
    await tx.delete(aiModelTable).where(
      and(
        eq(aiModelTable.serviceId, service.id),
        notInArray(
          aiModelTable.name,
          newModels.map((m) => m.name),
        ),
      ),
    );
    console.log("newModels", newModels);
    for (const model of newModels) {
      await tx
        .insert(aiModelTable)
        .values({ id: nanoid(10), name: model.name, visible: 1, serviceId: service.id })
        .onConflictDoNothing({
          target: [aiModelTable.name, aiModelTable.serviceId],
        });
    }
  });
  console.timeEnd("replaceModels");
  await invalidateModel(aiAccountTable, service);
}

export async function toggleVisible(service: Service, model: Model) {
  await useDb()
    .update(aiModelTable)
    .set({ visible: model.visible ? 0 : 1 })
    .where(and(eq(aiModelTable.id, model.id), eq(aiModelTable.serviceId, service.id)));
  await invalidateModel(aiAccountTable, service);
  await invalidateModel(aiModelTable, model);
}

export async function toggleAllVisible(service: Service, visible: 1 | 0) {
  console.time("toggleAllVisible");
  await useDb().update(aiModelTable).set({ visible }).where(eq(aiModelTable.serviceId, service.id));
  console.timeEnd("toggleAllVisible");
  await invalidateModel(aiAccountTable, service);
  await invalidate("view:chat");
}
