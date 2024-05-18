<script lang="ts">
  import { type Provider, Providers } from "$lib/providers";
  import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table/index";
  import { page } from "$app/stores";
  import { addService } from "../$data.js";
  import { toast } from "svelte-french-toast";
  import { goto } from "$app/navigation";
  import { DialogHeader, DialogTitle } from "@/components/ui/dialog/index.js";

  async function onSelect(provider: Provider) {
    try {
      const service = await addService(provider);
      if (!service) {
        return toast.error("Failed to add service");
      }
      await goto(`/project/${$page.params.id}/config/${service.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unknown error");
    }
  }
</script>

<DialogHeader>
  <DialogTitle>Select AI provider</DialogTitle>
</DialogHeader>
<div class="flex flex-col gap-2">
  <Table>
    <TableBody>
      {#each Providers as provider (provider.id)}
        <TableRow class="cursor-pointer" onclick={() => onSelect(provider)}>
          <TableCell class="p-2">{provider.name}</TableCell>
        </TableRow>
      {/each}
    </TableBody>
  </Table>
</div>
