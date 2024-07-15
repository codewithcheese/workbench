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
  import { AutoScroller } from "$lib/auto-scroller";
  import { nanoid } from "nanoid";

  type Props = {
    chat: Chat & { revisions: Revision[] };
    revision: RevisionView;
  };
  let { chat, revision }: Props = $props();
  let autoScroller = new AutoScroller(true);

  let chatService = new ChatService({
    initialMessages: revision.messages.length
      ? revision.messages.map(toChatMessage)
      : [{ id: nanoid(10), role: "user", content: "", attachments: [] }],
    onLoading: () => {
      autoScroller.onLoading();
    },
    onError: (e) => {
      toast.error(e.message);
    },
    onFinish: async (message) => {
      console.log("onFinish", message);
      const revision = await newRevision(chat.id, $state.snapshot(chatService.messages));
      if (!revision) {
        return;
      }
      await goto(`/chat/${chat.id}/revise/?version=${revision.version}`, { noScroll: true });
    },
    onMessageUpdate: () => {
      autoScroller.onMessageUpdate();
    },
  });

  $inspect("RevisePage", chatService.messages);

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
    return chatService.revise({
      providerId: model.service.providerId,
      modelName: model.name,
      baseURL: model.service.baseURL,
      apiKey: model.service.apiKey,
    });
  }

  async function handleRemoveAttachment(index: number) {
    toast.error("Not implemented");
  }

  $inspect("chatService", chatService.messages);
</script>

<ChatTitlebar {chat} {revision} tab="revise" onRunClick={handleSubmit} />
<div class="grid grid-cols-2 gap-3 overflow-y-auto px-4">
  <div class="flex flex-col gap-2 overflow-y-auto py-4">
    {#each chatService.messages as message, index (message.id)}
      {#if chatService.messages[chatService.messages.length - 1].role === "assistant" ? index < chatService.messages.length - 1 : true}
        <MessageCard
          bind:message={chatService.messages[index]}
          editable={true}
          onSubmit={handleSubmit}
          onRemoveAttachment={handleRemoveAttachment}
        />
      {/if}
    {/each}
  </div>
  <div class="flex flex-col gap-3 overflow-y-auto py-4" use:autoScroller.action>
    {#if chatService.messages.length > 0 && chatService.messages[chatService.messages.length - 1].role === "assistant"}
      <MessageCard
        message={chatService.messages[chatService.messages.length - 1]}
        onRemoveAttachment={handleRemoveAttachment}
      />
    {/if}
    {#if chatService.isLoading}
      <RobotLoader />
    {/if}
  </div>
</div>
