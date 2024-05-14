import { useDb } from "@/database/client";
import { and, asc, eq, notInArray } from "drizzle-orm";
import { serviceTable, type Service, modelTable, type Model } from "@/database/schema";
import type { Provider } from "@/providers";

export type ServiceView = Service & { models: Model[] };

export class Services {
  items: ServiceView[] = $state([]);

  async load() {
    this.items = await useDb().query.serviceTable.findMany({
      with: {
        models: true,
      },
    });
  }

  async addService(provider: Provider) {
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
    await this.load();
    if (result.length < 1) {
      throw Error("Failed to add service");
    }
    return this.items.find((r) => r.id === result[0].id)!;
  }

  async deleteService(id: string) {
    await useDb().transaction(async (tx) => {
      await tx.delete(modelTable).where(eq(modelTable.serviceId, id));
      await tx.delete(serviceTable).where(eq(serviceTable.id, id));
    });
    await this.load();
  }

  async updateService(view: ServiceView) {
    console.time("updateService");
    await useDb()
      .update(serviceTable)
      .set({ ...view })
      .where(eq(serviceTable.id, view.id));
    console.timeEnd("updateService");
  }

  async updateModels(view: ServiceView) {
    view.models = await useDb().query.modelTable.findMany({
      where: eq(modelTable.serviceId, view.id),
      orderBy: [asc(modelTable.id)],
    });
  }

  async replaceModels(view: ServiceView, newModels: any[]) {
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
    await this.updateModels(view);
  }

  async toggleVisible(view: ServiceView, model: Model) {
    await useDb()
      .update(modelTable)
      .set({ visible: model.visible ? 0 : 1 })
      .where(and(eq(modelTable.id, model.id), eq(modelTable.serviceId, view.id)));
    await this.updateModels(view);
  }

  async toggleAllVisible(view: ServiceView, visible: 1 | 0) {
    await useDb().update(modelTable).set({ visible }).where(eq(modelTable.serviceId, view.id));
    await this.updateModels(view);
  }
}

export const services: Services = new Services();
