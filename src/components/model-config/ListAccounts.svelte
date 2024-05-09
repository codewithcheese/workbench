<script lang="ts">
  import { db, type Service } from "@/store.svelte";
  import { Button } from "@/components/ui/button";
  import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
  import { PlusIcon } from "lucide-svelte";
  import { Providers, providersById } from "@/providers";
  import { TableHeader } from "@/components/ui/table/index.js";

  type Props = {
    onAdd: () => void;
    onSelect: (service: Service) => void;
  };
  let { onAdd, onSelect }: Props = $props();
</script>

<div class="flex flex-col gap-2">
  <Table>
    <TableHeader class="text-left">
      <TableCell class="p-2 font-semibold">Provider</TableCell>
      <TableCell class="p-2 font-semibold">Key name</TableCell>
    </TableHeader>
    <TableBody>
      {#if db.services.length === 0}
        <TableRow class="cursor-pointer">
          <TableCell class="p-2">No accounts configured</TableCell>
        </TableRow>
      {/if}
      {#each db.services as service (service.id)}
        {@const provider = providersById[service.providerId]}
        <TableRow class="cursor-pointer" onclick={() => onSelect(service)}>
          <TableCell class="p-2">{provider.name}</TableCell>
          <TableCell class="p-2">{service.name || "-"}</TableCell>
        </TableRow>
      {/each}
    </TableBody>
  </Table>
  <Button size="sm" variant="default" onclick={() => onAdd()}>
    <PlusIcon class="mr-2 h-4 w-4" />
    Add new
  </Button>
</div>
