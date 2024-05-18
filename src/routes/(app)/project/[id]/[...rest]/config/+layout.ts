import { loadServices } from "./$data";
import { registerModel, serviceTable } from "@/database";

export async function load({ depends, route }) {
  const services = await loadServices();
  registerModel(serviceTable, services, depends);
  depends("view:services");
  return {
    services,
  };
}
