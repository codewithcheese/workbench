<script lang="ts">
  import { Button } from "@/components/ui/button";
  import { PlusIcon } from "lucide-svelte";
  import { createTooltip, melt } from "@melt-ui/svelte";
  import { fade } from "svelte/transition";
  import { cn } from "$lib/cn";

  type Props = {
    index: number;
    warning?: string;
    handleInsertMessage: (index: number) => void;
  };
  let { index, warning, handleInsertMessage }: Props = $props();

  const {
    elements: { trigger, content, arrow },
    states: { open },
  } = createTooltip({
    positioning: {
      placement: "right-end",
    },
    openDelay: 0,
    closeDelay: 0,
    closeOnPointerDown: false,
    forceVisible: true,
  });
</script>

{#if $open && warning}
  <div
    use:melt={$content}
    transition:fade={{ duration: 100 }}
    class="z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md"
  >
    <div use:melt={$arrow} />
    <p>{warning}</p>
  </div>
{/if}

<div
  use:melt={$trigger}
  class={cn("group flex h-2 min-h-2 w-full items-center", warning && "bg-amber-100")}
>
  <div class="h-px flex-grow"></div>
  <div class="relative flex-shrink-0">
    <Button
      onclick={() => handleInsertMessage(index)}
      class="invisible absolute -left-3 -top-3 h-6 w-6 border border-gray-300 bg-white p-0 text-gray-800 shadow-sm transition-all delay-100 ease-in hover:bg-gray-100 group-hover:visible"
    >
      <PlusIcon class="h-4 w-4" />
    </Button>
  </div>
  <div class="h-px flex-grow"></div>
</div>
