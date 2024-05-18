<svelte:options runes={false} />

<script lang="ts">
  import { type Message } from "ai/svelte";
  import { LoaderCircleIcon, RefreshCwIcon, XIcon } from "lucide-svelte";
  import { Card, CardContent, CardHeader } from "@/components/ui/card";
  import { Label } from "@/components/ui/label";
  import { useChat } from "@/lib/use-chat";
  import { Badge } from "@/components/ui/badge";
  import { useDb } from "@/database/client";
  import { eq } from "drizzle-orm";
  import { modelTable, type ResponseMessage, responseTable, type Service } from "@/database/schema";
  import { store } from "@/lib/store.svelte";
  import { updateResponsePrompt } from "../$data";
  import { removeResponse, type ResponsesView, updateMessages } from "./$data.svelte";
  import { invalidateModel } from "@/database";

  export let response: ResponsesView[number];
  export let initialMessages: ResponseMessage[];
  export let service: Service;

  $: console.log("initialMessages", initialMessages);

  // when loading messages mark finalized as false
  // when loading complete update messages and set finalized to true
  let finalized = true;
  let format = "markdown";

  const { messages, reload, isLoading, stop, error } = useChat({
    // @ts-expect-error createdAt type mismatch
    initialMessages: initialMessages as Message[],
    body: {
      providerId: service.providerId,
      modelId: response.model.name,
      baseURL: service.baseURL,
      apiKey: service.apiKey,
    },
  });

  $: content = $messages.find((m) => m.role === "assistant")?.content || "";

  const lastMessageIsAssistant = $messages.findLast((m) => m.role === "assistant");
  if (!lastMessageIsAssistant && response.error === undefined) {
    refresh();
  }

  $: console.log("content", content);
  // $: console.log("id", response.id, JSON.stringify(response));

  // $: console.log("isLoading", $isLoading);

  async function refresh() {
    await updateResponsePrompt(response.id);
    if (store.selected.modelId && store.selected.modelId !== response.modelId) {
      // update modelId in response if selected model is valid
      const model = await useDb().query.modelTable.findFirst({
        where: eq(modelTable.id, store.selected.modelId),
      });
      if (model) {
        await useDb()
          .update(responseTable)
          .set({ modelId: model.id })
          .where(eq(responseTable.id, response.id));
      }
    }
    await invalidateModel(responseTable, response);
    console.log("reloading messages");
    await reload();
  }

  $: {
    if ($isLoading) {
      finalized = false;
    }
    if (!finalized && !$isLoading) {
      finalized = true;
      // @ts-expect-error messages type issue
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
        class="loading-icon text-gray-500 hover:bg-accent"
      />
    {:else}
      <RefreshCwIcon onclick={refresh} size={16} class="text-gray-500 hover:bg-accent" />
    {/if}

    <div class="pr-2 text-xs text-gray-500">{response.model.name}</div>
    <div class="flex-1"></div>
    <Badge onclick={() => (format = "markdown")} variant="outline" class="hover:bg-gray-200"
      >Markdown</Badge
    >
    <Badge onclick={() => (format = "text")} variant="outline" class="hover:bg-gray-200">Text</Badge
    >
    <XIcon class="text-gray-500" size={16} onclick={() => removeResponse(response.id)} />
  </CardHeader>
  <CardContent class="p-6">
    {#if response.error}
      <Label class="text-red-500">{response.error}</Label>
    {/if}

    <!--{#if format === "markdown"}-->
    <!--  <MessageMarkdown {message} />-->
    <!--{:else}-->
    <!--  -->
    <!--{/if}-->
    {content}
  </CardContent>
</Card>
