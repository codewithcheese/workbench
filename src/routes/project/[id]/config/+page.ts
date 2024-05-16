// import { services } from "@/stores/services.svelte";
// import { useDb } from "@/database/client";
import { loadServiceView } from "@/database/loaders";

export async function load({ depends, route }) {
  // await services.load(depends);

  return {
    services: await loadServiceView(route, depends),
  };
}
