<script lang="ts">
  import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
  import { goto } from "$app/navigation";
  import { store } from "$lib/store.svelte";
  import SelectModel from "./SelectModel.svelte";
  import { Button } from "@/components/ui/button";
  import { PlayIcon, SettingsIcon } from "lucide-svelte";
  import { submitPrompt } from "./$data";

  let { data } = $props();
  let services = $derived(data.services);
  let project = $derived(data.project);

  function tabClick(value?: string) {
    goto(`/project/${project.id}/${value}`);
  }

  $inspect("project layout", data);
</script>

<header
  class="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background p-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:pt-2"
>
  <Tabs onValueChange={tabClick} value={data.tab}>
    <TabsList>
      <TabsTrigger value="revise">Revise</TabsTrigger>
      <!--      <TabsTrigger value="chat">Chat</TabsTrigger>-->
      <TabsTrigger value="eval">Eval</TabsTrigger>
    </TabsList>
  </Tabs>
  <!--  <Sheet />-->
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
      <SelectModel {services} />
      <Button variant="ghost" onclick={() => goto(`/project/${project.id}/config`)}>
        <SettingsIcon size={16} />
      </Button>
    </div>
  </div>

  {#if store.selected.modelId}
    <Button onclick={() => submitPrompt(project, store.selected.modelId)}>
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

<div class="grid grid-cols-2 gap-3 overflow-y-auto px-4">
  <slot />
</div>
<!--{:else}-->
<!--  <Splash>-->
<!--    <p>Configure your AI accounts to start building.</p>-->
<!--    <Button onclick={() => document.getElementById("model-config-trigger")?.click()}>Start</Button>-->
<!--  </Splash>-->
<!--{/if}-->
