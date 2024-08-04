<script lang="ts">
  import { Button } from "@/components/ui/button/index.js";
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
  import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
  import { route } from "$lib/route";
  import { TrashIcon } from "lucide-svelte";

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
        <p>None found.</p>
      {/if}
      {#each data.aiAccounts as account (account.id)}
        <a
          href={route(`/settings/ai-accounts/[id]`, { id: account.id })}
          class="flex cursor-pointer items-center gap-4 p-4 hover:bg-muted/50"
        >
          <Avatar class="hidden h-8 w-8 sm:flex">
            <AvatarImage src="/icons/openai-32x32.png" alt="Avatar" />
            <AvatarFallback>OM</AvatarFallback>
          </Avatar>
          <div class="grid gap-1">
            <p class="text-sm font-medium leading-none">{account.name}</p>
            <p class="text-sm text-muted-foreground">{account.aiService.name}</p>
          </div>
        </a>
      {/each}
    </div>
  </CardContent>
</Card>
