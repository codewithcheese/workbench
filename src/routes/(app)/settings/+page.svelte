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
        <CardTitle>Your AI accounts</CardTitle>
        <CardDescription>Manage your AI accounts; API keys and models.</CardDescription>
      </div>
      <Button href={route("/settings/ai-accounts/add")}>Add account</Button>
    </div>
  </CardHeader>

  <CardContent>
    <div class="flex flex-col gap-2">
      {#if data.aiAccounts.length === 0}
        <p>No accounts found.</p>
        <p>Add an AI account to start a chatting.</p>
      {/if}
    </div>
  </CardContent>
</Card>
