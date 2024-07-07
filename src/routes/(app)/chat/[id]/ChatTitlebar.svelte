<script lang="ts">
  import { Button } from "@/components/ui/button/index.js";
  import { Input } from "@/components/ui/input/index.js";
  import { PlayIcon } from "lucide-svelte";
  import { updateChat } from "./$data.js";
  import type { Chat } from "@/database";
  import { untrack } from "svelte";

  type Props = {
    chat: Chat;
    tab: string;
    onRunClick?: () => void;
  };
  let { chat, tab, onRunClick }: Props = $props();
  let id = $derived(chat.id);
  let name = $state(chat.name);

  $effect(() => {
    id;
    untrack(() => {
      name = chat.name;
    });
  });
</script>

<div class="flex flex-row px-3">
  <Input
    class="border-none p-1 text-xl focus-visible:ring-0 focus-visible:ring-offset-0"
    bind:value={name}
    oninput={() => {
      updateChat(chat.id, { name });
    }}
  />
  {#if tab === "revise"}
    <Button variant="default" onclick={onRunClick}>
      <PlayIcon class="mr-2 h-4 w-4" /> Run
      <div
        class="w-13 pointer-events-none ml-2 hidden h-6 rounded-full bg-gray-700 px-2 py-1 md:inline-flex"
      >
        <div class="pointer-events-none text-center text-xs font-light text-white">Ctrl + ⏎</div>
      </div>
    </Button>
  {/if}
</div>
