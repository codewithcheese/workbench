<script lang="ts">
  import { cn } from "$lib/cn.js";
  import MessageMarkdown from "./revise/MessageMarkdown.svelte";
  import { Card, CardContent, CardHeader } from "@/components/ui/card/index.js";
  import Attachment from "./Attachment.svelte";
  import type { ChatMessage } from "$lib/chat-service.svelte";
  import MessageEditor from "./MessageEditor.svelte";
  import { Button } from "@/components/ui/button";
  import { FilePlus2Icon, PlusIcon, Trash, Trash2Icon, TrashIcon, UploadIcon } from "lucide-svelte";
  import { toast } from "svelte-french-toast";
  import AttachmentControls from "./AttachmentControls.svelte";
  import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

  type Props = {
    message: ChatMessage;
    editable?: boolean;
    highlightedForRemoval?: boolean;
    onSubmit?: () => void;
    onPaste?: () => void;
    onRemove?: () => void;
    onRemoveMouseEnter?: () => void;
    onRemoveMouseLeave?: () => void;
    onRemoveAttachment?: (index: number) => void;
  };
  let {
    message = $bindable(),
    editable,
    highlightedForRemoval = false,
    onSubmit,
    onPaste,
    onRemove = () => {},
    onRemoveAttachment,
    onRemoveMouseEnter = () => {},
    onRemoveMouseLeave = () => {},
  }: Props = $props();
  let format = "markdown";
  let showAttachmentControls = $state(false);

  function handleKeyPress(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === "Enter") {
      event.preventDefault();
      onSubmit && onSubmit();
      return true;
    }
    return false;
  }
</script>

{#if message.attachments && message.attachments.length > 0}
  <div class="flex flex-row flex-wrap gap-2">
    {#each message.attachments as attachment, index (index)}
      <Attachment
        type={attachment.type}
        content={attachment.content}
        onRemove={onRemoveAttachment != null ? onRemoveAttachment.bind(null, index) : undefined}
      />
    {/each}
  </div>
{/if}
{#if showAttachmentControls}
  <AttachmentControls
    onPaste={() => {
      showAttachmentControls = false;
      onPaste && onPaste();
    }}
  />
{/if}
<Card
  class={cn(
    "",
    message.role === "user" && "border-transparent bg-muted/100",
    !highlightedForRemoval && editable && "hover:border",
    highlightedForRemoval && "border-red-500",
  )}
>
  {#if editable}
    <div class="flex flex-row justify-end p-0">
      <div class="flex-1 overflow-hidden p-1 font-mono text-xs uppercase text-gray-500">
        {message.role}
      </div>
      <Button
        class="h-fit w-fit p-1 text-gray-500 hover:text-black"
        variant="ghost"
        size="icon"
        onclick={() => (showAttachmentControls = !showAttachmentControls)}
      >
        <FilePlus2Icon class="h-4 w-4" />
      </Button>
      <Tooltip openDelay={70}>
        <TooltipTrigger asChild let:builder>
          <Button
            builders={[builder]}
            class="h-fit w-fit p-1 text-gray-500 hover:text-black"
            variant="ghost"
            size="icon"
            onmouseenter={onRemoveMouseEnter}
            onmouseleave={onRemoveMouseLeave}
            onclick={onRemove}
          >
            <Trash2Icon class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Delete both to maintain user & assistant alternation</p>
        </TooltipContent>
      </Tooltip>
    </div>
  {/if}
  <CardContent class={cn("p-4", editable && "pt-0")}>
    {#if editable}
      <MessageEditor id={message.id} bind:content={message.content} onKeyPress={handleKeyPress} />
    {:else if format === "markdown"}
      <MessageMarkdown content={message.content} />
    {:else}
      {message.content}
    {/if}
  </CardContent>
</Card>
