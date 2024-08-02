import { registerModel, aiAccountTable, useDb } from "@/database";
import { eq } from "drizzle-orm";
import { error } from "@sveltejs/kit";

export async function load({ depends, params }) {
  const service = await useDb().query.aiAccountTable.findFirst({
    with: {
      models: true,
    },
    where: eq(aiAccountTable.id, params.serviceId),
  });
  if (!service) {
    return error(404, "Service not found");
  }
  registerModel(aiAccountTable, service, depends);
  depends("view:service");
  return {
    service,
  };
}
