<script lang="ts">
  import { XIcon } from "lucide-svelte";
  import { Button } from "@/components/ui/button";
  import { toTitleCase } from "$lib/string";

  type Props = {
    type: string;
    content: string;
    onRemove?: () => void;
  };
  let { type, content, onRemove }: Props = $props();
</script>

<div
  class="h-32 min-h-28 w-28 min-w-28 cursor-pointer overflow-hidden rounded-lg border border-gray-300 bg-white text-gray-700"
>
  <div class="relative h-full border-0">
    {#if onRemove}
      <Button
        variant="ghost"
        class="display-inline-block absolute right-1 top-1 z-10 h-4 cursor-pointer bg-white p-1 text-gray-500"
        on:click={onRemove}
      >
        <XIcon size={14} />
      </Button>
    {/if}
    <div class="flex h-full flex-col gap-1 p-2">
      <div class="relative flex-1 overflow-hidden">
        <p class="overflow-y-hidden break-words text-sm">{content}</p>
        <div
          class="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent"
        ></div>
      </div>
      <div class="name sticky bottom-0 text-sm font-semibold text-gray-700">
        {toTitleCase(type)}
      </div>
    </div>
  </div>
</div>
