<script lang="ts">
  import { Button } from "@/components/ui/button/index.js";
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
  import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
  import { route } from "$lib/route";

  let { data } = $props();
</script>

<Card>
  <CardHeader>
    <div class="flex flex-row items-center justify-between">
      <div>
        <CardTitle>Your keys</CardTitle>
        <CardDescription>Manage your API keys.</CardDescription>
      </div>
      <Button href={route("/settings/keys/add")}>Add API key</Button>
    </div>
  </CardHeader>

  <CardContent>
    <div class="flex flex-col gap-2">
      {#if data.keys.length === 0}
        <p>No keys found.</p>
      {/if}
      {#each data.keys as key (key.id)}
        <a
          href={route(`/settings/keys/[id]`, { id: key.id })}
          class="flex cursor-pointer items-center gap-4 p-4 hover:bg-muted/50"
        >
          <Avatar class="hidden h-8 w-8 sm:flex">
            <AvatarImage src="/icons/openai-32x32.png" alt="Avatar" />
            <AvatarFallback></AvatarFallback>
          </Avatar>
          <div class="grid gap-1">
            <p class="text-sm font-medium leading-none">{key.name}</p>
            <p class="text-sm text-muted-foreground">{key.service.name}</p>
          </div>
        </a>
      {/each}
    </div>
  </CardContent>
</Card>
