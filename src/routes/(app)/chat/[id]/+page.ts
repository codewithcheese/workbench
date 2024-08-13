import { registerModel, serviceTable, useDb } from "@/database";

export async function load({ params, depends }) {
  const services = await useDb().query.serviceTable.findMany({
    with: {
      sdk: true,
    },
  });
  const documentServices = services.filter((s) => s.sdk.type === "document");
  registerModel(serviceTable, documentServices, depends);
  return {
    documentServices,
  };
}
