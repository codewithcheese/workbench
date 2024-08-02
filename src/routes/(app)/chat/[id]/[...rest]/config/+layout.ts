import { loadServices } from "./$data";
import { registerModel, aiAccountTable } from "@/database";

export async function load({ depends, route }) {
  const services = await loadServices();
  registerModel(aiAccountTable, services, depends);
  depends("view:services");
  return {
    services,
  };
}
