import { useDb } from "@/database";

export async function loadAiAccounts() {
  return useDb().query.aiAccountTable.findMany({ with: { aiService: { with: { aiSdk: true } } } });
}

export async function loadAiServices() {
  return useDb().query.aiServiceTable.findMany({ with: { aiSdk: true } });
}
