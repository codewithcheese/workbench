<script lang="ts">
  import { ChatService, useChat } from "$lib/ai/use-chat.svelte";
  import { toast } from "svelte-french-toast";
  import { removeResponse, updateMessages } from "./revise/$data";
  import { Card, CardContent, CardHeader } from "@/components/ui/card";
  import { Input } from "@/components/ui/input";
  import MessageInput from "./MessageInput.svelte";
  import { Button } from "@/components/ui/button";
  import { LoaderCircleIcon, RefreshCwIcon, XIcon } from "lucide-svelte";
  import { Badge } from "@/components/ui/badge";
  import { Label } from "@/components/ui/label";
  import MessageMarkdown from "./revise/MessageMarkdown.svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
  import { store } from "$lib/store.svelte";
  import { getModelService } from "./$data";
  import { cn } from "$lib/cn";
  import { untrack } from "svelte";
  import type { ResponseMessage } from "@/database";

  type Props = {
    responseId: string;
    messages: ResponseMessage[];
  };
  let { responseId, messages }: Props = $props();
  let bottomRef: HTMLDivElement;

  let body = $state<{ providerId?: string; modelName?: string; baseURL?: string; apiKey?: string }>(
    {
      providerId: undefined,
      modelName: undefined,
      baseURL: undefined,
      apiKey: undefined,
    },
  );

  let chatService = new ChatService({
    // @ts-expect-error message type mismatch
    initialMessages: messages,
    body,
    onError: (e) => {
      toast.error(e.message);
    },
    onFinish: (message) => {
      updateMessages(responseId, $state.snapshot(chatService.messages));
    },
    onMessageUpdate: (messages) => {
      bottomRef.scrollIntoView({ behavior: "smooth" });
    },
  });

  async function handleSubmit(value: string) {
    if (!store.selected.modelId) {
      toast.error("No model selected");
      return;
    }
    const model = await getModelService(store.selected.modelId);
    if (!model) {
      toast.error("Selected model not found");
      return;
    }
    Object.assign(body, {
      providerId: model.service.providerId,
      modelName: model.name,
      baseURL: model.service.baseURL,
      apiKey: model.service.apiKey,
    });
    console.log("calling chat.handleSubmit", value);
    chatService.input = value;
    chatService.handleSubmit();
  }
</script>

<div class="flex flex-1 flex-col gap-2 p-4">
  {#each chatService.messages as message (message.id)}
    {@const format = "markdown"}
    {@const content = message.content}
    <Card class={cn("", message.role === "user" && "border-none bg-muted/100")}>
      <CardContent class="p-4">
        {#if chatService.error}
          <Label class="text-red-500">{chatService.error}</Label>
        {/if}

        {#if format === "markdown"}
          <MessageMarkdown {content} />
        {:else}
          {content}
        {/if}
      </CardContent>
    </Card>
  {/each}
  <div bind:this={bottomRef} id="bottom-anchor"></div>
</div>
<MessageInput onSubmit={handleSubmit} />
