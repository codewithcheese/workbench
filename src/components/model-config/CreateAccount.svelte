<script lang="ts">
  import { type Provider, Providers } from "@/providers";
  import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table/index";

  type Props = {
    onSelect: (provider: Provider) => void;
  };
  let { onSelect }: Props = $props();
</script>

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
