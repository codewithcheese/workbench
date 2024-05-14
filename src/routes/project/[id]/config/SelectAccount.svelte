<script lang="ts">
  import { db, type Service } from "@/store.svelte";
  import { Button } from "@/components/ui/button";
  import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
  import { PlusIcon } from "lucide-svelte";
  import { Providers, providersById } from "@/providers";
  import { TableHeader } from "@/components/ui/table/index.js";
  import type { ServiceConfigModel, ServiceView } from "./$model.svelte";

  type Props = {
    model: ServiceConfigModel;
    onAdd: () => void;
    onSelect: (service: ServiceView) => void;
  };
  let { model, onAdd, onSelect }: Props = $props();
</script>

<div class="flex flex-col gap-2">
  <Table>
    <TableHeader class="text-left">
      <TableCell class="p-2 font-semibold">Provider</TableCell>
      <TableCell class="p-2 font-semibold">Key name</TableCell>
    </TableHeader>
    <TableBody>
      {#if model.views.length === 0}
        <TableRow class="cursor-pointer">
          <TableCell class="p-2">No accounts configured</TableCell>
        </TableRow>
      {/if}
      {#each model.views as view (view.id)}
        {@const provider = providersById[view.providerId]}
        <TableRow class="cursor-pointer" onclick={() => onSelect(view)}>
          <TableCell class="p-2">{provider.name}</TableCell>
          <TableCell class="p-2">{view.name || "-"}</TableCell>
        </TableRow>
      {/each}
    </TableBody>
  </Table>
  <Button size="sm" variant="default" onclick={() => onAdd()}>
    <PlusIcon class="mr-2 h-4 w-4" />
    Add new
  </Button>
</div>
