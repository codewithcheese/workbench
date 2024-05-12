<script lang="ts">
  import Header from "@/routes/project/Header.svelte";
  import ResponseList from "@/routes/project/ResponseList.svelte";
  import EditorCard from "@/routes/project/EditorCard.svelte";
  import Splash from "@/components/Splash.svelte";
  import { Button } from "@/components/ui/button";
  import { db, type Project, type Response } from "@/store.svelte";
  import { Input } from "@/components/ui/input";
  import { page } from "$app/stores";
  import type { ProjectView } from "@/routes/project/[id]/+page";

  type Props = {
    data: {
      project: ProjectView;
    };
  };
  let { data }: Props = $props();

  let project = $derived(data.project);
</script>

{#if !project}
  <Splash>Project not found</Splash>
{:else}
  <Header {project} />
  {#if db.services.length > 0}
    <div class="px-4 pt-4"></div>
    <div class="grid grid-cols-2 gap-3 overflow-y-auto px-4">
      <div class="space-y-2 overflow-y-auto pl-1 pr-2 pt-1">
        <Input class="p-2 text-lg" bind:value={project.name} />
        <EditorCard {project} />
      </div>
      <div class="mr-1 space-y-2 overflow-y-auto pr-2 pt-1">
        <ResponseList responses={project.responses} />
      </div>
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
