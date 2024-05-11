import "../app.css";
import "@fontsource-variable/inter";
import { browser } from "$app/environment";
import { error } from "@sveltejs/kit";
import type { LayoutLoad } from "./$types";

export const ssr = false;

export const load: LayoutLoad = async ({ params }) => {
  const { PersistenceStore } = await import("@/lib/persistence");
  const store = new PersistenceStore();
  store.prompt();
  return {};
};
