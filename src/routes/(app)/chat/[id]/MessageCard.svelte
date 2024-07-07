<script lang="ts">
  import { cn } from "$lib/cn.js";
  import MessageMarkdown from "./revise/MessageMarkdown.svelte";
  import { Card, CardContent } from "@/components/ui/card/index.js";
  import type { Message } from "ai";

  type Props = {
    message: Message;
  };
  let { message }: Props = $props();
  let format = "markdown";
</script>

<Card class={cn("", message.role === "user" && "border-none bg-muted/100")}>
  <CardContent class="p-4">
    {#if format === "markdown"}
      <MessageMarkdown content={message.content} />
    {:else}
      {message.content}
    {/if}
  </CardContent>
</Card>
