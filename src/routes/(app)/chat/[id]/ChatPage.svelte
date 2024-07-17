<script lang="ts">
  import { type MessageAttachment, ChatService } from "$lib/chat-service.svelte.js";
  import { toast } from "svelte-french-toast";
  import MessageInput from "./MessageInput.svelte";
  import { store } from "$lib/store.svelte";
  import {
    appendMessage,
    createRevision,
    getModelService,
    type RevisionView,
    toChatMessage,
  } from "./$data";
  import type { Chat, Message, Revision } from "@/database";
  import MessageCard from "./MessageCard.svelte";
  import ChatTitlebar from "./ChatTitlebar.svelte";
  import { nanoid } from "nanoid";
  import RobotLoader from "@/components/RobotLoader.svelte";
  import { AutoScroller } from "$lib/auto-scroller";

  type Props = {
    chat: Chat & { revisions: Revision[] };
    revision?: RevisionView;
  };
  let { chat, revision }: Props = $props();
  let autoScroller = new AutoScroller();
  let saveAsNewRevision = $state(false);

  let chatService = new ChatService({
    id: chat.id,
    version: revision ? revision.version : 1,
    initialMessages: revision ? revision.messages.map(toChatMessage) : [],
    onLoading: () => {
      autoScroller.onLoading();
    },
    onError: (e) => {
      toast.error(e.message);
    },
    onFinish: (message) => {
      console.log("onFinish", chatService.hasChanges);
      appendMessage({ ...message, revisionId: revision!.id }, message.attachments);
      chatService.resetChanges();
    },
    onMessageUpdate: (messages) => {
      autoScroller.onMessageUpdate();
    },
  });

  async function handleSubmit(value: string, attachments: MessageAttachment[]): Promise<boolean> {
    if (!store.selected.modelId) {
      toast.error("No model selected");
      return false;
    }
    const model = await getModelService(store.selected.modelId);
    if (!model) {
      toast.error("Selected model not found");
      return false;
    }
    if (!revision) {
      revision = await createRevision(chat.id, $state.snapshot(chatService.messages));
    } else if (chatService.hasChanges) {
      saveAsNewRevision = true;
    }
    if (!revision) {
      toast.error("Failed to create revision");
      return false;
    }
    await appendMessage(
      { id: nanoid(10), role: "user", content: value, revisionId: revision.id },
      attachments,
    );
    chatService.input = value;
    chatService.attachments = attachments;
    chatService.submit({
      providerId: model.service.providerId,
      modelName: model.name,
      baseURL: model.service.baseURL,
      apiKey: model.service.apiKey,
    });
    return true;
  }
</script>

<ChatTitlebar {chat} {revision} tab="chat" unsavedChanges={chatService.hasChanges} />
<div class="flex flex-1 flex-col overflow-y-auto" use:autoScroller.action>
  <div class="flex flex-1 flex-col gap-2 p-4 pt-0">
    {#each chatService.messages as message, index (message.id)}
      <MessageCard {index} bind:message={chatService.messages[index]} />
    {/each}
    {#if chatService.isLoading}
      <RobotLoader />
    {/if}
  </div>
  <MessageInput onSubmit={handleSubmit} />
</div>
