import { loadAiServices } from "../../$data.test";
import { aiServiceTable, registerModel } from "@/database";

export async function load({ depends, route }) {
  const aiServices = await loadAiServices();
  registerModel(aiServiceTable, aiServices, depends);
  depends("view:services");
  return {
    aiServices,
  };
}
