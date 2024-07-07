<script lang="ts">
  import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
  import { goto } from "$app/navigation";
  import { store } from "$lib/store.svelte";
  import SelectModel from "./SelectModel.svelte";
  import { Button } from "@/components/ui/button";
  import { PlayIcon, SettingsIcon } from "lucide-svelte";
  import { submitPrompt, updateChat } from "./$data";
  import { Input } from "@/components/ui/input";

  let { data } = $props();
  let services = $derived(data.services);
  let chat = $derived(data.chat);

  function tabClick(value?: string) {
    if (value === "chat") {
      goto(`/chat/${chat.id}`);
    } else {
      goto(`/chat/${chat.id}/${value}`);
    }
  }

  async function handleNameChange() {
    await updateChat(chat.id, { name: data.chat.name });
  }

  $inspect("chat layout", data);
</script>

<header
  class="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background p-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:pt-2"
>
  <Tabs onValueChange={tabClick} value={data.tab}>
    <TabsList>
      <TabsTrigger value="chat">Chat</TabsTrigger>
      <TabsTrigger value="revise">Revise</TabsTrigger>
      <!--      <TabsTrigger value="eval">Eval</TabsTrigger>-->
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
      <Button variant="ghost" onclick={() => goto(`/chat/${chat.id}/config`)}>
        <SettingsIcon size={16} />
      </Button>
    </div>
  </div>
</header>

<div class="flex flex-1 flex-col overflow-y-auto">
  <div class="px-3">
    <Input
      class="border-none p-1 text-xl focus-visible:ring-0 focus-visible:ring-offset-0"
      bind:value={data.chat.name}
      oninput={handleNameChange}
    />
  </div>
  <slot />
</div>

<!--{:else}-->
<!--  <Splash>-->
<!--    <p>Configure your AI accounts to start building.</p>-->
<!--    <Button onclick={() => document.getElementById("model-config-trigger")?.click()}>Start</Button>-->
<!--  </Splash>-->
<!--{/if}-->
