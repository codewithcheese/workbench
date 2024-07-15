<script lang="ts">
  import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
  import { goto } from "$app/navigation";
  import SelectModel from "./SelectModel.svelte";
  import { Button } from "@/components/ui/button";
  import { PlayIcon, SettingsIcon } from "lucide-svelte";
  import { isTab, tabRouteId, updateChat } from "./$data";
  import { Input } from "@/components/ui/input";
  import { route } from "$lib/route";
  import { toast } from "svelte-french-toast";

  let { data } = $props();
  let services = $derived(data.services);
  let chat = $derived(data.chat);
  let revision = $derived(data.revision);

  async function tabClick(value?: string) {
    if (!isTab(value)) {
      toast.error(`Unexpected tab ${value}`);
      return;
    }
    const query = revision ? { version: revision.version } : undefined;
    if (value === "chat") {
      await goto(route(`/chat/[id]`, { id: chat.id, $query: query }));
    } else if (value === "revise" || value === "eval") {
      await goto(route(`/chat/[id]/${value}`, { id: chat.id, $query: query }));
    }
  }

  $inspect("chat layout", data);
</script>

<header
  class="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 pt-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent"
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
      <Button
        variant="ghost"
        onclick={() => goto(route(`/chat/[id]/[...rest]/config`, { id: chat.id, rest: "" }))}
      >
        <SettingsIcon size={16} />
      </Button>
    </div>
  </div>
</header>

<div class="flex flex-1 flex-col overflow-y-auto">
  <slot />
</div>
