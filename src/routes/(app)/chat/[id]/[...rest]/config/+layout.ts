import { loadServices } from "./$data";
import { registerModel, keyTable } from "@/database";

export async function load({ depends, route }) {
  const services = await loadServices();
  registerModel(keyTable, services, depends);
  depends("view:services");
  return {
    services,
  };
}
