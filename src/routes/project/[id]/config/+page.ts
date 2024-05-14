import { ServiceConfigModel } from "./$model.svelte";

export async function load() {
  const model = new ServiceConfigModel();
  await model.load();
  return {
    model,
  };
}
