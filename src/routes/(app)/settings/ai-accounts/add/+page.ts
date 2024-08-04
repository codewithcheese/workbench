import { loadAiServices } from "../../$data.test";
import { aiServiceTable, registerModel } from "@/database";
import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { formSchema } from "../$data";

export async function load({ depends, route }) {
  const form = await superValidate(zod(formSchema));
  const aiServices = await loadAiServices();
  registerModel(aiServiceTable, aiServices, depends);
  depends("view:services");
  return {
    form,
    aiServices,
  };
}
