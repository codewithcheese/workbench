<script lang="ts">
  import EditorCard from "./EditorCard.svelte";
  import MessageCard from "../MessageCard.svelte";
  import { getModelService, newRevision, type RevisionView, toChatMessage } from "../$data";
  import { store } from "$lib/store.svelte";
  import { ChatService } from "$lib/chat-service.svelte.js";
  import { toast } from "svelte-french-toast";
  import ChatTitlebar from "../ChatTitlebar.svelte";
  import { goto } from "$app/navigation";
  import type { Chat, Revision, Message } from "@/database";
  import RobotLoader from "@/components/RobotLoader.svelte";

  type Props = {
    chat: Chat & { revisions: Revision[] };
    revision: RevisionView;
  };
  let { chat, revision }: Props = $props();
  let bottomRef: HTMLDivElement;

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
    initialMessages: revision.messages.map(toChatMessage),
    mode: editIndex != null ? { type: "edit", index: editIndex } : { type: "append" },
    body,
    onError: (e) => {
      toast.error(e.message);
    },
    onFinish: async (message) => {
      console.log("onFinish", message);
      const revision = await newRevision(chat.id, $state.snapshot(chatService.messages));
      if (!revision) {
        return;
      }
      await goto(`/chat/${chat.id}/revise/?version=${revision.version}`);
    },
    onMessageUpdate: (messages) => {
      bottomRef.scrollIntoView({ behavior: "instant" });
    },
  });

  $inspect("input", chatService.input, editIndex);

  let assistantMessage = $derived(findAssistantMessage());

  function findEditIndex() {
    const editIndex = revision.messages.findLastIndex((m) => m.role === "user");
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

  async function handleRemoveAttachment(index: number) {
    toast.error("Not implemented");
  }
</script>

<ChatTitlebar {chat} {revision} tab="revise" onRunClick={handleSubmit} />
<div class="grid grid-cols-2 gap-3 overflow-y-auto px-4">
  <div class="flex flex-col gap-2 overflow-y-auto py-4">
    {#each chatService.messages as message, index (message.id)}
      {#if editIndex == null || index < editIndex}
        <MessageCard {message} onRemoveAttachment={handleRemoveAttachment} />
      {/if}
    {/each}
    <EditorCard bind:prompt={chatService.input} {chat} onSubmit={handleSubmit} />
  </div>
  <div class="flex flex-col gap-3 overflow-y-auto py-4">
    {#if assistantMessage}
      <MessageCard message={assistantMessage} onRemoveAttachment={handleRemoveAttachment} />
    {/if}
    {#if chatService.isLoading}
      <RobotLoader />
    {/if}
    <div bind:this={bottomRef}></div>
  </div>
</div>
