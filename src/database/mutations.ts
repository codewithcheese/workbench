import type { Provider } from "@/providers";
import { useDb } from "@/database/client";
import { type Model, modelTable, serviceTable } from "@/database/schema";
import { and, asc, eq, notInArray } from "drizzle-orm";
import type { ServiceView } from "@/stores/services.svelte";
import { invalidate } from "$app/navigation";

export async function addService(provider: Provider) {
  const newId = crypto.randomUUID();
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

export async function deleteService(id: string) {
  await useDb().transaction(async (tx) => {
    await tx.delete(modelTable).where(eq(modelTable.serviceId, id));
    await tx.delete(serviceTable).where(eq(serviceTable.id, id));
  });
  await invalidate("view:services");
}

export async function updateService(view: ServiceView) {
  console.time("updateService");
  await useDb()
    .update(serviceTable)
    .set({ ...view })
    .where(eq(serviceTable.id, view.id));
  console.timeEnd("updateService");
  await invalidate("view:services");
}

export async function updateModels(view: ServiceView) {
  view.models = await useDb().query.modelTable.findMany({
    where: eq(modelTable.serviceId, view.id),
    orderBy: [asc(modelTable.id)],
  });
  await invalidate("view:services");
}

export async function replaceModels(view: ServiceView, newModels: any[]) {
  console.time("replaceModels");
  await useDb().transaction(async (tx) => {
    // remove models that no longer exist
    await tx.delete(modelTable).where(
      and(
        eq(modelTable.serviceId, view.id),
        notInArray(
          modelTable.id,
          newModels.map((m) => m.id),
        ),
      ),
    );
    console.log("newModels", newModels);
    for (const model of newModels) {
      await tx
        .insert(modelTable)
        .values({ ...model, name: model.name || model.id, visible: 1, serviceId: view.id })
        .onConflictDoUpdate({
          target: [modelTable.id, modelTable.serviceId],
          set: model,
        });
    }
  });
  console.timeEnd("replaceModels");
  // await this.updateModels(view);
  await invalidate("view:services");
}

export async function toggleVisible(view: ServiceView, model: Model) {
  await useDb()
    .update(modelTable)
    .set({ visible: model.visible ? 0 : 1 })
    .where(and(eq(modelTable.id, model.id), eq(modelTable.serviceId, view.id)));
  // await this.updateModels(view);
  await invalidate("view:services");
}

export async function toggleAllVisible(view: ServiceView, visible: 1 | 0) {
  await useDb().update(modelTable).set({ visible }).where(eq(modelTable.serviceId, view.id));
  // await this.updateModels(view);
  await invalidate("view:services");
}
