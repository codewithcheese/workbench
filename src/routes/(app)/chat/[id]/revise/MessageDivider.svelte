<script lang="ts">
  import { Button } from "@/components/ui/button";
  import { PlusIcon } from "lucide-svelte";
  import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

  type Props = {
    index: number;
    warning?: string;
    handleInsertMessage: (index: number) => void;
  };
  let { index, warning, handleInsertMessage }: Props = $props();
</script>

{#if warning}
  <Tooltip openDelay={70}>
    <TooltipTrigger class="group flex h-2 w-full items-center bg-amber-100">
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
    </TooltipTrigger>
    <TooltipContent>
      <p>
        {warning}
      </p>
    </TooltipContent>
  </Tooltip>
{:else}
  <div class="group flex h-2 w-full items-center">
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
{/if}
