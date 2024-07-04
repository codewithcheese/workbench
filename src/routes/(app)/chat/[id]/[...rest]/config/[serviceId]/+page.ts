import { registerModel, serviceTable, useDb } from "@/database";
import { eq } from "drizzle-orm";
import { error } from "@sveltejs/kit";

export async function load({ depends, params }) {
  const service = await useDb().query.serviceTable.findFirst({
    with: {
      models: true,
    },
    where: eq(serviceTable.id, params.serviceId),
  });
  if (!service) {
    return error(404, "Service not found");
  }
  registerModel(serviceTable, service, depends);
  depends("view:service");
  return {
    service,
  };
}
