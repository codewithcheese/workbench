<script lang="ts">
  import { cn } from "$lib/cn.js";
  import MessageMarkdown from "./revise/MessageMarkdown.svelte";
  import { Card, CardContent } from "@/components/ui/card/index.js";
  import Attachment from "./Attachment.svelte";
  import type { ChatMessage } from "$lib/chat-service.svelte";
  import MessageEditor from "./MessageEditor.svelte";
  import { Button } from "@/components/ui/button";
  import { EditIcon, EyeIcon, FilePlus2Icon, Trash2Icon } from "lucide-svelte";
  import AttachmentControls from "./AttachmentControls.svelte";
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";

  type Props = {
    index: number;
    message: ChatMessage;
    editable?: boolean;
    highlightedForRemoval?: boolean;
    onSubmit?: () => void;
    onPaste?: () => void;
    onRemove?: () => void;
    onRemoveAttachment?: (index: number) => void;
  };
  let {
    index,
    message = $bindable(),
    editable,
    highlightedForRemoval = false,
    onSubmit,
    onPaste,
    onRemove,
    onRemoveAttachment,
  }: Props = $props();
  let format = "markdown";
  let showAttachmentControls = $state(false);
  let mode: "edit" | "view" = $state("edit");

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
  <div class="mb-1 flex flex-row flex-wrap gap-2">
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
    <div class="flex flex-row p-0">
      <DropdownMenu>
        <DropdownMenuTrigger class="p-1 font-mono text-xs uppercase text-gray-500">
          {message.role}
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onclick={() => (message.role = "user")}>User</DropdownMenuItem>
          <DropdownMenuItem onclick={() => (message.role = "assistant")}>
            Assistant
          </DropdownMenuItem>
          <DropdownMenuItem onclick={() => (message.role = "system")}>System</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div class="flex-1"></div>
      <Button
        class="h-fit w-fit p-1 text-gray-500 hover:text-black"
        variant="ghost"
        size="icon"
        onclick={() => (showAttachmentControls = !showAttachmentControls)}
      >
        <FilePlus2Icon class="h-4 w-4" />
      </Button>
      <Button
        class="h-fit w-fit p-1 text-gray-500 hover:text-black "
        variant="ghost"
        size="icon"
        onclick={() => (mode = mode === "edit" ? "view" : "edit")}
      >
        {#if mode === "view"}
          <EditIcon class="h-4 w-4" />
        {:else}
          <EyeIcon class="h-4 w-4" />
        {/if}
      </Button>
      <Button
        class="h-fit w-fit p-1 text-gray-500 hover:text-black"
        variant="ghost"
        size="icon"
        onclick={onRemove}
      >
        <Trash2Icon class="h-4 w-4" />
      </Button>
    </div>
  {/if}
  <CardContent class={cn("p-4", editable && "pt-0")}>
    {#if mode === "edit" && editable}
      <MessageEditor
        id={message.id}
        content={message.content}
        onChange={(content) => (message.content = content)}
        onKeyPress={handleKeyPress}
      />
    {:else if format === "markdown"}
      <MessageMarkdown content={message.content} />
    {:else}
      {message.content}
    {/if}
  </CardContent>
</Card>
