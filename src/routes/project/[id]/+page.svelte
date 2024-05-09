<script lang="ts">
  import Header from "@/routes/project/Header.svelte";
  import ResponseList from "@/routes/project/ResponseList.svelte";
  import EditorCard from "@/routes/project/EditorCard.svelte";
  import Splash from "@/components/Splash.svelte";
  import { Button } from "@/components/ui/button";
  import { db } from "@/store.svelte";
  import { Input } from "@/components/ui/input";
  import { page } from "$app/stores";

  let project = $derived(db.projects.get($page.params.id));
</script>

{#if !project}
  <Splash>Project not found</Splash>
{:else}
  <Header {project} />
  {#if db.services.length > 0}
    <div class="px-4 pt-4"></div>
    <div class="grid max-h-[calc(100vh-100px)] grid-cols-2 gap-4 p-4">
      <div class="space-y-2">
        <Input class="p-2 text-lg" bind:value={project.name} />
        <EditorCard {project} />
      </div>
      <ResponseList {project} />
    </div>
  {:else}
    <Splash>
      <p>Configure your AI accounts to start building.</p>
      <Button onclick={() => document.getElementById("model-config-trigger")?.click()}>
        Start
      </Button>
    </Splash>
  {/if}
{/if}
