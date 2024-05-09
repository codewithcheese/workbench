<svelte:options runes={false} />

<script lang="ts">
  import { type Message } from "ai/svelte";
  import {
    store,
    db,
    type Service,
    type Response,
    removeResponse,
    updateResponsePrompt,
  } from "@/store.svelte";
  import { LoaderCircleIcon, RefreshCwIcon, XIcon } from "lucide-svelte";
  import { Card, CardContent, CardHeader } from "@/components/ui/card";
  import { Label } from "@/components/ui/label";
  import { useChat } from "@/lib/use-chat";
  import MessageMarkdown from "./MessageMarkdown.svelte";
  import { Badge } from "@/components/ui/badge";

  export let response: Response;
  export let service: Service;

  // when loading messages mark finalized as false
  // when loading complete update messages and set finalized to true
  let finalized = true;
  let format = "markdown";

  const { messages, reload, isLoading, stop, error } = useChat({
    initialMessages: db.messages.filter((m) => m.responseId === response.id) as Message[],
    body: {
      providerId: service.providerId,
      modelId: response.modelId,
      baseURL: service.baseURL,
      apiKey: service.apiKey,
    },
  });

  const lastMessageIsAssistant = $messages.findLast((m) => m.role === "assistant");
  if (!lastMessageIsAssistant && response.error === undefined) {
    refresh();
  }

  $: console.log("id", response.id, JSON.stringify(response));

  $: console.log("isLoading", $isLoading);

  function refresh() {
    updateResponsePrompt(response.id);
    if (store.selected.modelId && store.selected.modelId !== response.modelId) {
      response.modelId = store.selected.modelId;
    }
    reload();
  }

  $: {
    if ($isLoading) {
      finalized = false;
    }
    if (!finalized && !$isLoading) {
      finalized = true;
      // clear previous messages
      console.log("Replacing messages", $messages);
      db.messages
        .filter((m) => m.responseId === response.id)
        .forEach((m) => {
          db.messages.remove(m.id);
        });
      // add new messages
      for (const message of $messages) {
        if (!db.messages.get(message.id)) {
          db.messages.push({ ...message, responseId: response.id });
        }
      }
    }
  }

  // set error when response is not ok
  $: {
    if ($error) {
      response.error = $error.message;
    } else {
      response.error = undefined;
    }
  }
</script>

<Card>
  <CardHeader class="flex flex-row space-x-2 space-y-0 bg-muted/50 p-2">
    {#if $isLoading}
      <LoaderCircleIcon
        onclick={stop}
        size={16}
        class="loading-icon text-gray-500 hover:bg-accent"
      />
    {:else}
      <RefreshCwIcon onclick={refresh} size={16} class="text-gray-500 hover:bg-accent" />
    {/if}

    <div class="pr-2 text-xs text-gray-500">{response.modelId}</div>
    <div class="flex-1"></div>
    <Badge onclick={() => (format = "markdown")} variant="outline" class="hover:bg-gray-200"
      >Markdown</Badge
    >
    <Badge onclick={() => (format = "text")} variant="outline" class="hover:bg-gray-200">Text</Badge
    >
    <XIcon class="text-gray-500" size={16} onclick={() => removeResponse(response)} />
  </CardHeader>
  <CardContent class="p-6">
    {#if response.error}
      <Label class="text-red-500">{response.error}</Label>
    {/if}
    {#each $messages.filter((m) => m.role === "assistant") as message, index}
      {#if format === "markdown"}
        <MessageMarkdown {message} />
      {:else}
        {message.content}
      {/if}
    {/each}
  </CardContent>
</Card>
