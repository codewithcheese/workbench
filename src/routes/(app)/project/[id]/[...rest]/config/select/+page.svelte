<script lang="ts">
  import { Button } from "@/components/ui/button";
  import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
  import { PlusIcon } from "lucide-svelte";
  import { providersById } from "$lib/providers";
  import { TableHeader } from "@/components/ui/table/index.js";
  import type { ServicesView } from "../$data";
  import { DialogTitle } from "@/components/ui/dialog";
  import { DialogHeader } from "@/components/ui/dialog/index.js";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";

  let { data } = $props();

  function onSelect(service: ServicesView[number]) {
    goto(`/project/${$page.params.id}/config/${service.id}`);
  }

  function onAdd() {
    goto(`/project/${$page.params.id}/config/create`);
  }
</script>

<DialogHeader>
  <DialogTitle>Your AI accounts</DialogTitle>
</DialogHeader>
<div class="flex flex-col gap-2">
  <Table>
    <TableHeader class="text-left">
      <TableCell class="p-2 font-semibold">Provider</TableCell>
      <TableCell class="p-2 font-semibold">Key name</TableCell>
    </TableHeader>
    <TableBody>
      {#if data.services.length === 0}
        <TableRow class="cursor-pointer">
          <TableCell class="p-2">No accounts configured</TableCell>
        </TableRow>
      {/if}
      {#each data.services as service (service.id)}
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
