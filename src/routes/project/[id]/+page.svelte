<script lang="ts">
  import Header from "@/routes/project/Header.svelte";
  import EditorCard from "@/routes/project/EditorCard.svelte";
  import Splash from "@/components/Splash.svelte";
  import { Button } from "@/components/ui/button";
  import { db } from "@/store.svelte";
  import { Input } from "@/components/ui/input";
  import ResponseCard from "@/routes/project/ResponseCard.svelte";

  let { data } = $props();
  let project = $derived(data.project);
</script>

<Header {project} />
{#if db.services.length > 0}
  <div class="px-4 pt-4"></div>
  <div class="grid grid-cols-2 gap-3 overflow-y-auto px-4">
    <div class="space-y-2 overflow-y-auto pl-1 pr-2 pt-1">
      <Input class="p-2 text-lg" bind:value={project.name} />
      <EditorCard {project} />
    </div>
    <div class="mr-1 space-y-2 overflow-y-auto pr-2 pt-1">
      {#each data.project.responses.toReversed() as response (response.id)}
        {@const model = response.model}
        {@const service = model.service}
        <ResponseCard {response} {service} />
      {/each}
    </div>
  </div>
{:else}
  <Splash>
    <p>Configure your AI accounts to start building.</p>
    <Button onclick={() => document.getElementById("model-config-trigger")?.click()}>Start</Button>
  </Splash>
{/if}
