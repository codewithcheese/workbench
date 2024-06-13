<svelte:options runes={false} />

<script lang="ts">
  import { type Message, useChat } from "ai/svelte";
  import { LoaderCircleIcon, RefreshCwIcon, XIcon } from "lucide-svelte";
  import { Card, CardContent, CardHeader } from "@/components/ui/card";
  import { Label } from "@/components/ui/label";
  import { Badge } from "@/components/ui/badge";
  import { useDb } from "@/database/client";
  import { eq } from "drizzle-orm";
  import { modelTable, type ResponseMessage, responseTable, type Service } from "@/database/schema";
  import { store } from "@/lib/store.svelte";
  import { updateResponsePrompt } from "../$data";
  import { removeResponse, type ResponsesView, updateMessages } from "./$data.svelte";
  import { invalidateModel } from "@/database";
  import MessageMarkdown from "./MessageMarkdown.svelte";

  export let response: ResponsesView[number];
  export let initialMessages: ResponseMessage[];
  export let service: Service;

  // when loading messages mark finalized as false
  // when loading complete update messages and set finalized to true
  let finalized = true;
  let format = "markdown";

  let body = {
    providerId: service.providerId,
    modelName: response.model.name,
    baseURL: service.baseURL,
    apiKey: service.apiKey,
  };

  $: body = {
    providerId: service.providerId,
    modelName: response.model.name,
    baseURL: service.baseURL,
    apiKey: service.apiKey,
  };

  let { messages, reload, isLoading, stop, error } = useChat({
    // @ts-expect-error createdAt type mismatch
    initialMessages,
    body,
  });

  $: ({ messages, reload, isLoading, stop, error } = useChat({
    // @ts-expect-error createdAt type mismatch
    initialMessages,
    body,
  }));

  $: content = $messages.find((m) => m.role === "assistant")?.content || "";

  const lastMessageIsAssistant = $messages.findLast((m) => m.role === "assistant");
  if (!lastMessageIsAssistant && response.error == null) {
    refresh();
  }

  async function refresh() {
    await updateResponsePrompt(response.id);
    if (store.selected.modelId && store.selected.modelId !== response.modelId) {
      // update modelId in response if selected model is valid
      const model = await useDb().query.modelTable.findFirst({
        where: eq(modelTable.id, store.selected.modelId),
        with: {
          service: true,
        },
      });
      if (model) {
        await useDb()
          .update(responseTable)
          .set({ modelId: model.id })
          .where(eq(responseTable.id, response.id));
      }
    }
    await invalidateModel(responseTable, response);
    // @ts-expect-error hack to update messages
    $messages = initialMessages;
    await reload();
  }

  $: {
    if ($isLoading) {
      finalized = false;
    }
    if (!finalized && !$isLoading) {
      finalized = true;
      updateMessages(response.id, $messages);
    }
  }

  // set error when response is not ok
  $: {
    if ($error) {
      response.error = $error.message;
    } else {
      response.error = null;
    }
  }
</script>

<Card>
  <CardHeader class="flex flex-row space-x-2 space-y-0 bg-muted/50 p-2">
    {#if $isLoading}
      <LoaderCircleIcon
        onclick={stop}
        size={16}
        class="loading-icon cursor-pointer text-gray-500 hover:bg-accent"
      />
    {:else}
      <RefreshCwIcon
        onclick={refresh}
        size={16}
        class="cursor-pointer text-gray-500 hover:bg-accent"
      />
    {/if}

    <div class="pr-2 text-xs text-gray-500">{response.model.name}</div>
    <div class="flex-1"></div>
    <Badge onclick={() => (format = "markdown")} variant="outline" class="hover:bg-gray-200"
      >Markdown</Badge
    >
    <Badge onclick={() => (format = "text")} variant="outline" class="hover:bg-gray-200">Text</Badge
    >
    <XIcon
      class="text-gray-500"
      size={16}
      onclick={() => {
        stop();
        removeResponse(response.id);
      }}
    />
  </CardHeader>
  <CardContent class="p-6">
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
