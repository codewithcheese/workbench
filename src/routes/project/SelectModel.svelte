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
  import { store, db } from "@/store.svelte";
  import { providersById } from "@/providers";

  const selected = $derived(
    store.selected.modelId
      ? { value: store.selected.modelId, label: store.selected.modelId }
      : undefined,
  );

  const visibleModels = $derived(db.models.filter((m) => m.visible));
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
    {#each db.services as service, index}
      {@const provider = providersById[service.providerId]}
      <SelectGroup>
        <SelectLabel>{provider.name} {service.name ? `(${service.name})` : ""}</SelectLabel>
        {#each db.models.filter((m) => m.serviceId === service.id && m.visible) as model, index}
          <SelectItem value={model.id}>
            {model.id}
          </SelectItem>
        {/each}
      </SelectGroup>
    {/each}
  </SelectContent>
</Select>
