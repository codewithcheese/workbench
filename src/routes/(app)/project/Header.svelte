<script lang="ts">
  import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
  } from "@/components/ui/breadcrumb";
  import { Button } from "@/components/ui/button";
  import { type Model, type Project, store, submitPrompt } from "@/store.svelte";
  import SelectModel from "@/routes/project/SelectModel.svelte";
  import { PlayIcon, SettingsIcon } from "lucide-svelte";
  import Sheet from "@/components/Sheet.svelte";
  import { goto } from "$app/navigation";

  type Props = {
    project: Project;
  };
  let { project }: Props = $props();
</script>

<header
  class="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:pt-2"
>
  <Sheet />
  <nav aria-label="breadcrumb" class="hidden md:flex">
    <!--    <Breadcrumb>-->
    <!--      <BreadcrumbList>-->
    <!--        <BreadcrumbItem>-->
    <!--          <BreadcrumbLink href="/">Home</BreadcrumbLink>-->
    <!--        </BreadcrumbItem>-->
    <!--      </BreadcrumbList>-->
    <!--    </Breadcrumb>-->
  </nav>
  <div class="relative ml-auto flex-1 md:grow-0">
    <div class="flex flex-row">
      <SelectModel />
      <Button variant="ghost" onclick={() => goto(`/project/${project.id}/config`)}>
        <SettingsIcon size={16} />
      </Button>
    </div>
  </div>

  {#if store.selected.modelId}
    <Button onclick={() => submitPrompt(project)}>
      <PlayIcon size={16} class="mr-2" />
      Run
      <div
        class="w-13 pointer-events-none ml-1 hidden h-6 rounded-full bg-white bg-opacity-20 px-2 py-1 md:inline-flex"
      >
        <div class="pointer-events-none text-center text-xs font-light text-white">Ctrl + ⏎</div>
      </div>
    </Button>
  {/if}
</header>
