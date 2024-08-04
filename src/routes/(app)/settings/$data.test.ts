import { useDb } from "@/database";

export async function loadKeys() {
  return useDb().query.keyTable.findMany({ with: { service: { with: { sdk: true } } } });
}

export async function loadServices() {
  return useDb().query.serviceTable.findMany({ with: { sdk: true } });
}
