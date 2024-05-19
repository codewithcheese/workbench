<script lang="ts">
  import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
  import { store } from "@/lib/store.svelte";
  import { providersById } from "@/lib/providers";
  import type { ServicesView } from "./$data";
  import { modelTable, useDb } from "@/database";
  import { asc, desc, eq } from "drizzle-orm";

  let { services }: { services: ServicesView } = $props();

  let visibleModels = $derived(services.map((s) => s.models.filter((m) => m.visible)).flat());

  let modelsById = $derived(
    services
      .map((s) => s.models)
      .flat()
      .reduce<Record<string, any>>((acc, model) => {
        acc[model.id] = model;
        return acc;
      }, {}),
  );

  $inspect(visibleModels);

  let selected = $derived(
    store.selected.modelId && modelsById[store.selected.modelId]
      ? { value: store.selected.modelId, label: modelsById[store.selected.modelId].name }
      : undefined,
  );

  $effect(() => {
    visibleModels;
    (async () => {
      // if selected model is not available then select next available model
      if (!(await isSelectedModelAvailable())) {
        await selectNextAvailableModel();
      }
      // if no model selected then select first available model
      if (!store.selected.modelId) {
        await selectNextAvailableModel();
      }
    })();
  });

  async function isSelectedModelAvailable() {
    if (!store.selected.modelId) {
      // if nothing selected then consider it available
      return true;
    }
    const model = await useDb().query.modelTable.findFirst({
      where: eq(modelTable.id, store.selected.modelId),
    });
    console.log("isSelectedModelAvailable", model, !!(model && model.visible));
    return !!(model && model.visible);
  }

  async function selectNextAvailableModel() {
    const model = await useDb().query.modelTable.findFirst({
      where: eq(modelTable.visible, 1),
      orderBy: asc(modelTable.createdAt),
    });
    console.log("selectNextAvailableModel", model);
    if (!model) {
      store.selected.modelId = null;
    } else {
      store.selected.modelId = model.id;
    }
  }

  $inspect(store.selected.modelId, selected);
</script>

<Select
  disabled={visibleModels.length === 0}
  {selected}
  onSelectedChange={(selected) => {
    if (selected && selected.value) {
      store.selected.modelId = selected.value;
      console.log("Updated selected model", store.selected.modelId);
    }
  }}
>
  <SelectTrigger class="w-[240px]">
    <SelectValue placeholder={visibleModels.length ? "Select a model" : "No models configured"} />
  </SelectTrigger>
  <SelectContent>
    {#each services as service (service.id)}
      {@const provider = providersById[service.providerId]}
      <SelectGroup>
        <SelectLabel>{provider.name} {service.name ? `(${service.name})` : ""}</SelectLabel>
        {#each service.models as model (model.id)}
          {#if model.visible}
            <SelectItem value={model.id}>
              {model.name}
            </SelectItem>
          {/if}
        {/each}
      </SelectGroup>
    {/each}
  </SelectContent>
</Select>
