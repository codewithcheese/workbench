<script lang="ts">
  import { Button } from "@/components/ui/button";
  import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
  import { PlusIcon } from "lucide-svelte";
  import { providersById } from "@/providers";
  import { TableHeader } from "@/components/ui/table/index.js";
  import type { ServiceView } from "@/database/loaders";
  // import type { Services, ServiceView } from "@/stores/services.svelte";

  type Props = {
    services: ServiceView[];
    onAdd: () => void;
    onSelect: (id: string) => void;
  };
  let { services, onAdd, onSelect }: Props = $props();
</script>

<div class="flex flex-col gap-2">
  <Table>
    <TableHeader class="text-left">
      <TableCell class="p-2 font-semibold">Provider</TableCell>
      <TableCell class="p-2 font-semibold">Key name</TableCell>
    </TableHeader>
    <TableBody>
      {#if services.length === 0}
        <TableRow class="cursor-pointer">
          <TableCell class="p-2">No accounts configured</TableCell>
        </TableRow>
      {/if}
      {#each services as service (service.id)}
        {@const provider = providersById[service.providerId]}
        <TableRow class="cursor-pointer" onclick={() => onSelect(service.id)}>
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
