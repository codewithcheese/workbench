<svelte:options runes={false} />

<script lang="ts">
  import { type Message } from "ai/svelte";
  import { LoaderCircleIcon, RefreshCwIcon, XIcon } from "lucide-svelte";
  import { Card, CardContent, CardHeader } from "@/components/ui/card";
  import { Label } from "@/components/ui/label";
  import { useChat } from "@/lib/use-chat";
  import { Badge } from "@/components/ui/badge";
  import { useDb } from "@/database/client";
  import { asc, eq } from "drizzle-orm";
  import {
    projectTable,
    type Response,
    type ResponseMessage,
    responseMessageTable,
    responseTable,
    type Service,
  } from "@/database/schema";
  import { toast } from "svelte-french-toast";
  import { store } from "@/lib/store.svelte";
  import { invalidateAll } from "$app/navigation";
  import { updateResponsePrompt } from "./$data";

  export let response: Response;
  export let initialMessages: ResponseMessage[];
  export let service: Service;

  // when loading messages mark finalized as false
  // when loading complete update messages and set finalized to true
  let finalized = true;
  let format = "markdown";

  const { messages, reload, isLoading, stop, error } = useChat({
    initialMessages: initialMessages as Message[],
    body: {
      providerId: service.providerId,
      modelId: response.modelId,
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
      await useDb()
        .update(responseTable)
        .set({ modelId: store.selected.modelId })
        .where(eq(responseTable.id, response.id));
    }
    await reload();
  }

  async function updateMessages() {
    const currentMessages = await useDb().query.responseMessageTable.findMany({
      where: eq(responseMessageTable.responseId, response.id),
      orderBy: [asc(responseMessageTable.index)],
    });
    let index = 0;
    await useDb().transaction(async (tx) => {
      for (const newMessage of $messages) {
        const currentMessage = currentMessages[index];
        if (currentMessage && newMessage.id !== currentMessage.id) {
          // update required
          await tx.update(responseMessageTable).set({ ...newMessage, index });
        } else if (!currentMessage) {
          // new message
          await tx
            .insert(responseMessageTable)
            .values({ ...newMessage, responseId: response.id, index });
        }
        index += 1;
      }
    });
  }

  async function removeResponse(response: Response) {
    const db = useDb();
    console.time("removeMessages");
    // const deleteQuery = `
    //   DELETE FROM responseMessage
    //   WHERE responseId = '${response.id}'
    // `;
    // console.log("deleteQuery", deleteQuery);
    // await useDb().run(sql.raw(deleteQuery));
    await db.delete(responseMessageTable).where(eq(responseMessageTable.responseId, response.id));
    console.timeEnd("removeMessages");

    console.time("removeResponse");
    await db.delete(responseTable).where(eq(responseTable.id, response.id));
    console.timeEnd("removeResponse");

    await invalidateAll();
  }

  $: {
    if ($isLoading) {
      finalized = false;
    }
    if (!finalized && !$isLoading) {
      finalized = true;
      updateMessages();
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

    <!--{#if format === "markdown"}-->
    <!--  <MessageMarkdown {message} />-->
    <!--{:else}-->
    <!--  -->
    <!--{/if}-->
    {content}
  </CardContent>
</Card>
