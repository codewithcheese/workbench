import { services } from "@/stores/services.svelte";

export async function load() {
  await services.load();
  return {
    services,
  };
}
