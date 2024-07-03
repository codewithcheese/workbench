import { exposeDb } from "@/database";

export const ssr = false;

export async function load({ route, url }) {
  await exposeDb();
}
