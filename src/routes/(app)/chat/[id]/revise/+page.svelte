<script lang="ts">
  import EditorCard from "./EditorCard.svelte";
  import MessageCard from "../MessageCard.svelte";
  import { getModelService } from "../$data";
  import { store } from "$lib/store.svelte";
  import { ChatService } from "$lib/chat-service.svelte.js";
  import { toast } from "svelte-french-toast";
  import ChatTitlebar from "../ChatTitlebar.svelte";

  let { data } = $props();

  let editIndex = $state(findEditIndex());

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
    initialMessages: data.revision.messages,
    mode: editIndex != null ? { type: "edit", index: editIndex } : { type: "append" },
    body,
    onError: (e) => {
      toast.error(e.message);
    },
    onFinish: (message) => {
      console.log("onFinish", message);
      // todo save new revision and load it
      // updateMessages(data.response.id, $state.snapshot(chatService.messages));
    },
  });

  $inspect("input", chatService.input, editIndex);

  let assistantMessage = $derived(findAssistantMessage());

  function findEditIndex() {
    const editIndex = data.revision.messages.findLastIndex((m) => m.role === "user");
    return editIndex === -1 ? undefined : editIndex;
  }

  function findAssistantMessage() {
    return editIndex != null
      ? chatService.messages.find((m, index) => m.role === "assistant" && index > editIndex!)
      : undefined;
  }

  async function handleSubmit() {
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
    chatService.handleSubmit();
  }
</script>

<ChatTitlebar chat={data.chat} tab="revise" onRunClick={handleSubmit} />
<div class="grid grid-cols-2 gap-3 overflow-y-auto px-4">
  <div class="flex flex-col gap-2 overflow-y-auto py-4">
    {#each chatService.messages as message, index (message.id)}
      {#if editIndex == null || index < editIndex}
        <MessageCard {message} />
      {/if}
    {/each}
    <EditorCard bind:prompt={chatService.input} chat={data.chat} onSubmit={handleSubmit} />
  </div>
  <div class="flex flex-col gap-3 py-4">
    {#if assistantMessage}
      <MessageCard message={assistantMessage} />
    {/if}
  </div>
</div>
