import { registerModel, keyTable, useDb } from "@/database";
import { eq } from "drizzle-orm";
import { error } from "@sveltejs/kit";

export async function load({ depends, params }) {
  const service = await useDb().query.keyTable.findFirst({
    with: {
      models: true,
    },
    where: eq(keyTable.id, params.serviceId),
  });
  if (!service) {
    return error(404, "Service not found");
  }
  registerModel(keyTable, service, depends);
  depends("view:service");
  return {
    service,
  };
}
