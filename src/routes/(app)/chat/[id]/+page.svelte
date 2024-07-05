<script lang="ts">
  import { useChat } from "$lib/use-chat.svelte";
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

  let { data } = $props();
  let service = $derived(data.response.model?.service);
  let response = $derived(data.response);
  let bottomRef: HTMLDivElement;

  $inspect("chat page", data);

  let body = $state<{ providerId?: string; modelName?: string; baseURL?: string; apiKey?: string }>(
    {
      providerId: undefined,
      modelName: undefined,
      baseURL: undefined,
      apiKey: undefined,
    },
  );

  let chat = useChat({
    // @ts-expect-error message type mismatch
    initialMessages: response.messages,
    body,
    onError: (e) => {
      toast.error(e.message);
    },
    onFinish: (message) => {
      updateMessages(response.id, $state.snapshot(chat.messages));
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
    chat.input = value;
    chat.handleSubmit();
  }

  function scrollToBottom() {
    bottomRef.scrollIntoView({ behavior: "smooth" });
  }

  $effect(() => {
    chat.messages;
    untrack(() => {
      scrollToBottom();
    });
  });
</script>

<div class="mb-[100px] flex h-full flex-col gap-2 p-4">
  {#each chat.messages as message (message.id)}
    {@const format = "markdown"}
    {@const content = message.content}
    <Card class={cn("", message.role === "user" && "border-none bg-muted/100")}>
      <CardContent class="p-4">
        {#if response.error}
          <Label class="text-red-500">{response.error}</Label>
        {/if}

        {#if format === "markdown"}
          <MessageMarkdown {content} />
        {:else}
          {content}
        {/if}
      </CardContent>
    </Card>
  {/each}
  <div bind:this={bottomRef} id="bottom-anchor" class="flex-1"></div>
</div>
<MessageInput onSubmit={handleSubmit} />
