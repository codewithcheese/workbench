<script lang="ts">
  import { Button } from "@/components/ui/button/index.js";
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  import { Input } from "@/components/ui/input/index.js";
  import { PlusCircleIcon } from "lucide-svelte";
  import { providersById } from "$lib/providers";
  import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
  import { goto } from "$app/navigation";
  import { route } from "$lib/route";

  let { data } = $props();
</script>

<Card>
  <CardHeader>
    <div class="flex flex-row items-center justify-between">
      <div>
        <CardTitle>AI accounts</CardTitle>
        <CardDescription>Manage your AI accounts and their API keys and models.</CardDescription>
      </div>
      <Button href={route("/settings/ai-accounts/add")}>Add account</Button>
    </div>
  </CardHeader>

  <CardContent>
    <div class="flex flex-col gap-2">
      <Table>
        <TableHeader class="text-left text-muted-foreground">
          <TableCell class="p-2 font-semibold">Name</TableCell>
          <TableCell class="p-2 font-semibold">Service</TableCell>
        </TableHeader>
        <TableBody>
          {#if data.aiAccounts.length === 0}
            <TableRow class="cursor-pointer">
              <TableCell class="p-2">No accounts found.</TableCell>
            </TableRow>
          {/if}
          {#each data.aiAccounts as aiAccount (aiAccount.id)}
            <TableRow
              class="cursor-pointer"
              onclick={() => goto(route(`/settings/ai-accounts/[id]`, { id: aiAccount.id }))}
            >
              <TableCell class="p-2">{aiAccount.name || "-"}</TableCell>
              <TableCell class="p-2">{aiAccount.aiService.name}</TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    </div>
  </CardContent>
</Card>
