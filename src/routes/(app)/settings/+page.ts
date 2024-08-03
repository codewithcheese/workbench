import { aiAccountTable, registerModel } from "@/database";
import { loadAiAccounts } from "./$data.test";

export async function load({ depends, route }) {
  const aiAccounts = await loadAiAccounts();
  registerModel(aiAccountTable, aiAccounts, depends);
  depends("view:services");
  return {
    aiAccounts,
  };
}
