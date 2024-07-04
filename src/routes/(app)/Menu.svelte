<script lang="ts">
  import { EllipsisVerticalIcon, FileIcon, PlusIcon, PocketKnifeIcon } from "lucide-svelte";
  import { Button } from "@/components/ui/button/index";
  import * as DropdownMenu from "@/components/ui/dropdown-menu/index";
  import * as Dialog from "@/components/ui/dialog/index";
  import { page } from "$app/stores";
  import { cn } from "$lib/cn";
  import { goto } from "$app/navigation";
  import DeleteDialog from "@/components/DeleteDialog.svelte";
  import PersistenceAlert from "@/components/PersistenceAlert.svelte";
  import { type Chat } from "@/database";
  import { duplicateChat, newChat, removeChat } from "./$data";

  let { chats }: { chats: Chat[] } = $props();

  let chatId: string | undefined = $derived.by(() => {
    if ($page.url.pathname.startsWith("/project")) {
      return $page.params.id;
    }
  });

  let chatToDelete: Chat | null = $state(null);
</script>

<div class="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
  <a href="/" class="flex flex-1 items-center gap-2 font-semibold">
    <PocketKnifeIcon class="h-6 w-6" />
    <span class="">Workbench</span>
  </a>
  <!--  <Button class="h-8 w-8 rounded-full p-1" variant="outline" onclick={() => downloadDatabase()}>-->
  <!--    <DatabaseBackupIcon class="text-gray-600" />-->
  <!--  </Button>-->
  <Button
    class="h-8 w-8 rounded-full p-1"
    variant="outline"
    onclick={async () => {
      const id = await newChat();
      goto(`/project/${id}`);
    }}
  >
    <PlusIcon class="text-gray-600" />
  </Button>
</div>
<div class="flex-1">
  <nav class="grid items-start text-sm font-medium">
    <div class="p-2 pt-0">
      <PersistenceAlert />
    </div>
    <div
      class:bg-accent={$page.url.pathname.startsWith("/document")}
      class="group flex flex-row items-center px-4"
    >
      <Button
        href="/document"
        variant="ghost"
        class={cn(
          "w-full justify-start gap-2 overflow-x-hidden p-0 text-muted-foreground hover:bg-transparent",
          $page.url.pathname.startsWith("/document") && "text-primary",
        )}
      >
        <FileIcon
          class={cn(
            "h-4 w-4 text-gray-500",
            $page.url.pathname.startsWith("/document") && "text-primary",
          )}
        />
        Documents
      </Button>
    </div>
    <div class="mt-6 overflow-x-hidden">
      <h3 class="mb-2 overflow-hidden text-ellipsis break-all px-4 text-xs font-medium">Recent</h3>
      {#each chats.toReversed() as chat (chat.id)}
        <div
          class:bg-accent={chat.id === chatId}
          class="group flex flex-row items-center overflow-x-hidden px-4"
        >
          <Button
            variant="ghost"
            href={`/project/${chat.id}`}
            class={cn(
              "w-full justify-start p-0 text-muted-foreground hover:bg-transparent",
              chat.id === chatId && "text-primary",
            )}
          >
            {chat.name}
          </Button>
          <div class="flex flex-1"></div>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild let:builder>
              <Button
                builders={[builder]}
                variant="ghost"
                class="w-6 p-0 opacity-0 group-hover:opacity-100"
              >
                <EllipsisVerticalIcon class="h-4 w-4 text-gray-500" /></Button
              >
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              <DropdownMenu.Item onclick={() => (chatToDelete = chat)}>Delete</DropdownMenu.Item>
              <DropdownMenu.Item
                onclick={async () => {
                  const newId = await duplicateChat(chat.id);
                  await goto(`/project/${newId}`);
                }}>Duplicate</DropdownMenu.Item
              >
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      {/each}
    </div>
  </nav>
</div>
{#if chatToDelete}
  <DeleteDialog
    name={chatToDelete.name}
    type="chat"
    onConfirm={async () => {
      if (chatToDelete) {
        const nextId = await removeChat(chatToDelete.id);
        await goto(`/project/${nextId}`);
      }
    }}
    onCancel={() => {
      chatToDelete = null;
    }}
  />
{/if}
