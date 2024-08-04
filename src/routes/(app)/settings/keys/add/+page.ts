import { loadServices } from "../../$data.test";
import { serviceTable, registerModel } from "@/database";
import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { formSchema } from "../$data";

export async function load({ depends, route }) {
  const form = await superValidate(zod(formSchema));
  const services = await loadServices();
  registerModel(serviceTable, services, depends);
  depends("view:services");
  return {
    form,
    services,
  };
}
