<script lang="ts">
  import { BanIcon, XIcon } from "lucide-svelte";
  import { Button } from "@/components/ui/button";
  import RobotLoader from "@/components/RobotLoader.svelte";
  import type { Attachment } from "$lib/attachment-service.svelte";
  import { humanType } from "$lib/util/mime";

  type Props = {
    attachment: Attachment;
    onRemove?: () => void;
  };
  let { attachment, onRemove }: Props = $props();
</script>

<div
  class="h-32 min-h-28 w-28 min-w-28 overflow-hidden rounded-lg border border-gray-300 bg-white text-gray-700"
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
        {#if attachment.loading}
          <RobotLoader />
        {:else if attachment.error}
          <div class="flex h-full w-full items-center justify-center">
            <p class="text-sm text-red-500">{attachment.error.message}</p>
          </div>
        {:else if attachment.type.startsWith("image/")}
          <img src={attachment.content} alt="Pasted" class="w-full" />
        {:else}
          <p class="overflow-y-hidden break-all text-sm">{attachment.content}</p>
        {/if}
        <div
          class="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent"
        ></div>
      </div>
      <div class="name sticky bottom-0 text-sm font-semibold text-gray-700">
        {humanType(attachment.type)}
      </div>
    </div>
  </div>
</div>
