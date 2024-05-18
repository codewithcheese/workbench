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

  let selected = $derived(
    store.selected.modelId && modelsById[store.selected.modelId]
      ? { value: store.selected.modelId, label: modelsById[store.selected.modelId].name }
      : undefined,
  );

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
