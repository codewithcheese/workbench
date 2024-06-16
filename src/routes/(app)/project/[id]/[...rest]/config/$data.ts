import {
  invalidateModel,
  type Model,
  modelTable,
  type Service,
  serviceTable,
  useDb,
} from "@/database";
import type { Provider } from "$lib/providers";
import { and, asc, eq, notInArray } from "drizzle-orm";
import { invalidate } from "$app/navigation";
import { nanoid } from "nanoid";

export type ServicesView = Awaited<ReturnType<typeof loadServices>>;

export async function loadServices() {
  return useDb().query.serviceTable.findMany({
    with: {
      models: true,
    },
  });
}

export async function addService(provider: Provider) {
  const newId = nanoid(10);
  const result = await useDb()
    .insert(serviceTable)
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
    await tx.delete(modelTable).where(eq(modelTable.serviceId, service.id));
    await tx.delete(serviceTable).where(eq(serviceTable.id, service.id));
  });
  await invalidateModel(serviceTable, service);
}

export async function updateService(service: Service) {
  console.time("updateService");
  await useDb()
    .update(serviceTable)
    .set({ ...service })
    .where(eq(serviceTable.id, service.id));
  console.timeEnd("updateService");
  await invalidateModel(serviceTable, service);
}

export async function replaceModels(service: Service, newModels: any[]) {
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
  await invalidateModel(serviceTable, service);
}

export async function toggleVisible(service: Service, model: Model) {
  await useDb()
    .update(modelTable)
    .set({ visible: model.visible ? 0 : 1 })
    .where(and(eq(modelTable.id, model.id), eq(modelTable.serviceId, service.id)));
  await invalidateModel(serviceTable, service);
  await invalidateModel(modelTable, model);
}

export async function toggleAllVisible(service: Service, visible: 1 | 0) {
  console.time("toggleAllVisible");
  await useDb().update(modelTable).set({ visible }).where(eq(modelTable.serviceId, service.id));
  console.timeEnd("toggleAllVisible");
  await invalidateModel(serviceTable, service);
  await invalidate("view:project");
}
