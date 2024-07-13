<script lang="ts">
  import { cn } from "$lib/cn.js";
  import MessageMarkdown from "./revise/MessageMarkdown.svelte";
  import { Card, CardContent } from "@/components/ui/card/index.js";
  import Attachment from "./Attachment.svelte";
  import type { ChatMessage } from "$lib/chat-service.svelte";

  type Props = {
    message: ChatMessage;
    onRemoveAttachment: (index: number) => void;
  };
  let { message, onRemoveAttachment }: Props = $props();
  let format = "markdown";

  $inspect("MessageCard", message);
</script>

<Card class={cn("", message.role === "user" && "border-none bg-muted/100")}>
  <CardContent class="p-4">
    {#if message.attachments && message.attachments.length > 0}
      <div class="flex max-w-full flex-row gap-2 overflow-y-auto">
        {#each message.attachments as attachment, index (index)}
          <Attachment
            type={attachment.type}
            content={attachment.content}
            onRemove={() => onRemoveAttachment(index)}
          />
        {/each}
      </div>
    {/if}
    {#if format === "markdown"}
      <MessageMarkdown content={message.content} />
    {:else}
      {message.content}
    {/if}
  </CardContent>
</Card>
