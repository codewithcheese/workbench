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
  import type { KeysView } from "./$data";
  import { modelTable, useDb } from "@/database";
  import { asc, eq } from "drizzle-orm";

  let { keys }: { keys: KeysView } = $props();

  let visibleModels = $derived(keys.map((key) => key.models.filter((m) => m.visible)).flat());

  let modelsById = $derived(
    keys
      .map((key) => key.models)
      .flat()
      .reduce<Record<string, any>>((acc, model) => {
        acc[model.id] = model;
        return acc;
      }, {}),
  );

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
    return !!(model && model.visible);
  }

  async function selectNextAvailableModel() {
    const model = await useDb().query.modelTable.findFirst({
      where: eq(modelTable.visible, 1),
      orderBy: asc(modelTable.createdAt),
    });
    if (!model) {
      store.selected.modelId = null;
    } else {
      store.selected.modelId = model.id;
    }
  }
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
    {#each keys as key (key.id)}
      <SelectGroup>
        <SelectLabel>{key.service.name} {key.name ? `(${key.name})` : ""}</SelectLabel>
        {#each key.models as model (model.id)}
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
