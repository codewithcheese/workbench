<script lang="ts">
  import { Button } from "@/components/ui/button/index.js";
  import { Input } from "@/components/ui/input/index.js";
  import { ArrowBigLeftIcon, ArrowBigRightIcon, ArrowLeftIcon, PlayIcon } from "lucide-svelte";
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
    onRunClick?: () => void;
  };
  let { chat, revision, tab, onRunClick }: Props = $props();
  let id = $derived(chat.id);
  let name = $state(chat.name);

  let versions = $derived.by(() => {
    let previous = revision.version > 1 ? String(revision.version - 1) : undefined;
    let next = revision.version < chat.revisions.length ? String(revision.version + 1) : undefined;
    let previousOptions = { id: chat.id, $query: { version: previous } };
    let nextOptions = { id: chat.id, $query: { version: next } };
    const routeId = tab;
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
          ? `/chat/${chat.id}/revise/?version=${next}`
          : `/chat/${chat.id}/?version=${next}`
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

<div class="flex flex-row gap-4 border-b border-gray-200 px-3 py-2">
  <Input
    class="border-none p-1 text-xl focus-visible:ring-0 focus-visible:ring-offset-0"
    bind:value={name}
    oninput={() => {
      updateChat(chat.id, { name });
    }}
  />
  <div class="flex flex-row items-center">
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
  </div>
  {#if tab === "revise"}
    <Button
      variant="default"
      class="focus-visible:ring-0 focus-visible:ring-offset-0"
      onclick={onRunClick}
    >
      <PlayIcon class="mr-2 h-4 w-4" /> Run
      <div
        class="w-13 pointer-events-none ml-2 hidden h-6 rounded-full bg-gray-700 px-2 py-1 md:inline-flex"
      >
        <div class="pointer-events-none text-center text-xs font-light text-white">Ctrl + ⏎</div>
      </div>
    </Button>
  {/if}
</div>
