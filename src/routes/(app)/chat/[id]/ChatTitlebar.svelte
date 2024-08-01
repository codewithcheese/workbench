<script lang="ts">
  import { Button } from "@/components/ui/button/index.js";
  import { Input } from "@/components/ui/input/index.js";
  import {
    ArrowBigLeftIcon,
    ArrowBigRightIcon,
    ArrowLeftIcon,
    BanIcon,
    CheckIcon,
    PlayIcon,
  } from "lucide-svelte";
  import { updateChat } from "./$data.js";
  import type { Chat, Revision } from "@/database";
  import { untrack } from "svelte";
  import { Badge } from "@/components/ui/badge";
  import { route } from "$lib/route";

  type Props = {
    chat: Chat & {
      revisions: Revision[];
    };
    revision: Revision;
    tab: string;
    isLoading: boolean;
    onSubmit: () => void;
    unsavedChanges: boolean;
  };
  let { chat, revision, tab, isLoading, onSubmit, unsavedChanges = false }: Props = $props();
  let id = $derived(chat.id);
  let name = $state(chat.name);

  let versions = $derived.by(() => {
    let previous = revision && revision.version > 1 ? String(revision.version - 1) : undefined;
    let next =
      revision && revision.version < chat.revisions.length
        ? String(revision.version + 1)
        : undefined;
    return {
      previous,
      next,
      previousLink: previous
        ? tab === "revise"
          ? route(`/chat/[id]/${tab}`, { id: chat.id, $query: { version: String(previous) } })
          : route(`/chat/[id]`, { id: chat.id, $query: { version: String(previous) } })
        : undefined,
      nextLink: next
        ? tab === "revise"
          ? route(`/chat/[id]/revise`, { id: chat.id, $query: { version: next } })
          : route(`/chat/[id]`, { id: chat.id, $query: { version: next } })
        : undefined,
    };
  });

  $effect(() => {
    id;
    untrack(() => {
      name = chat.name;
    });
  });
</script>

<div class="flex flex-row gap-4 px-4 py-2">
  <Input
    class="border-none p-1 text-xl focus-visible:ring-0 focus-visible:ring-offset-0"
    bind:value={name}
    oninput={() => {
      updateChat(chat.id, { name });
    }}
  />
  {#if unsavedChanges}
    <Button variant="secondary" class="rounded-full" onclick={async () => {}}>Unsaved</Button>
  {/if}
  <div class="flex flex-row items-center">
    {#if revision}
      <Button
        href={versions.previousLink}
        disabled={!versions.previousLink}
        class="rounded-full p-0 text-gray-700"
        variant="ghost"
      >
        <ArrowBigLeftIcon class="h-4 w-4" />
      </Button>
      <Badge variant="secondary">v{revision.version}</Badge>
      <Button
        href={versions.nextLink}
        disabled={!versions.nextLink}
        class="rounded-full p-0 text-gray-700"
        variant="ghost"
      >
        <ArrowBigRightIcon class="h-4 w-4" />
      </Button>
    {/if}
  </div>
  {#if tab === "revise"}
    <Button
      variant="default"
      class="focus-visible:ring-0 focus-visible:ring-offset-0"
      onclick={onSubmit}
    >
      {#if isLoading}
        <BanIcon class="mr-2 h-4 w-4" /> Stop
      {:else}
        <PlayIcon class="mr-2 h-4 w-4" /> Run
      {/if}
      <div
        class="w-13 pointer-events-none ml-2 hidden h-6 rounded-full bg-gray-700 px-2 py-1 md:inline-flex"
      >
        <div class="pointer-events-none text-center text-xs font-light text-white">Ctrl + ⏎</div>
      </div>
    </Button>
  {/if}
</div>
