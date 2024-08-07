<script lang="ts">
  import { useChat } from "$lib/use-chat.svelte";
  import { LoaderCircleIcon, RefreshCwIcon, XIcon } from "lucide-svelte";
  import { Card, CardContent, CardHeader } from "@/components/ui/card";
  import { Label } from "@/components/ui/label";
  import { Badge } from "@/components/ui/badge";
  import { useDb } from "@/database/client";
  import { eq } from "drizzle-orm";
  import {
    type Model,
    modelTable,
    type ResponseMessage,
    responseTable,
    type Service,
  } from "@/database/schema";
  import { store } from "@/lib/store.svelte";
  import { updateResponsePrompt } from "../$data";
  import { removeResponse, type ResponsesView, updateMessages } from "./$data";
  import { invalidateModel } from "@/database";
  import MessageMarkdown from "./MessageMarkdown.svelte";
  import { toast } from "svelte-french-toast";
  import { untrack } from "svelte";
  import { Button } from "@/components/ui/button";

  type Props = {
    response: ResponsesView[number] & { model: Model | null };
    initialMessages: ResponseMessage[];
    service: Service | null;
  };
  let { response, initialMessages, service }: Props = $props();

  let format = $state("markdown");
  let id = $derived(response.id);
  let done = $state(false);
  let body = $state({
    providerId: service?.providerId,
    modelName: response.model?.name,
    baseURL: service?.baseURL,
    apiKey: service?.apiKey,
  });

  $effect(() => {
    Object.assign(body, {
      providerId: service?.providerId,
      modelName: response.model?.name,
      baseURL: service?.baseURL,
      apiKey: service?.apiKey,
    });
  });

  let chat = useChat({
    // @ts-expect-error createdAt type mismatch
    initialMessages,
    body,
    onError: (e) => {
      console.log("onError", e);
      toast.error(e.message);
    },
    onFinish: (message) => {
      console.log("onFinish", chat.messages, message);
      updateMessages(response.id, $state.snapshot(chat.messages));
    },
  });

  let content = $derived(chat.messages.find((m) => m.role === "assistant")?.content || "");
  let lastMessageIsAssistant = $derived(chat.messages.findLast((m) => m.role === "assistant"));

  // reset done when id changes
  $effect(() => {
    id;
    untrack(() => {
      // reset done when id changes
      done = false;
    });
  });

  // request a chat response on first load if last message is not assistant
  $effect(() => {
    if (!lastMessageIsAssistant && response.error == null && !done) {
      done = true;
      untrack(() => {
        console.log("refreshing");
        chat.reload();
      });
    }
  });

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
    chat.messages = initialMessages;
    await chat.reload();
  }
</script>

<Card>
  <CardHeader class="flex flex-row items-center space-x-2 space-y-0 bg-muted/50 p-2">
    {#if chat.isLoading}
      <Button
        name="stop"
        onclick={() => chat.stop()}
        variant="ghost"
        class="h-6 w-6 p-1 text-gray-500"
      >
        <LoaderCircleIcon class="loading-icon" />
      </Button>
    {:else}
      <Button
        aria-label="refresh"
        onclick={refresh}
        variant="ghost"
        class="h-6 w-6 p-1 text-gray-500"
      >
        <RefreshCwIcon />
      </Button>
      <!--      <RefreshCwIcon-->
      <!--        onclick={refresh}-->
      <!--        size={16}-->
      <!--        class="cursor-pointer text-gray-500 hover:bg-accent"-->
      <!--      />-->
    {/if}

    <div class="pr-2 text-xs text-gray-500">{response.model?.name || "deleted"}</div>
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
