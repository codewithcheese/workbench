import { exposeDb } from "@/database/expose-db";

export const ssr = false;

export async function load({ route, url }) {
  await exposeDb();
}
