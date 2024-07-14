<script lang="ts">
  import { type MessageAttachment, ChatService } from "$lib/chat-service.svelte.js";
  import { toast } from "svelte-french-toast";
  import MessageInput from "./MessageInput.svelte";
  import { store } from "$lib/store.svelte";
  import { appendMessage, getModelService, type RevisionView, toChatMessage } from "./$data";
  import type { Chat, Message, Revision } from "@/database";
  import MessageCard from "./MessageCard.svelte";
  import ChatTitlebar from "./ChatTitlebar.svelte";
  import { nanoid } from "nanoid";
  import RobotLoader from "@/components/RobotLoader.svelte";

  type Props = {
    chat: Chat & { revisions: Revision[] };
    revision: RevisionView;
  };
  let { chat, revision }: Props = $props();
  let bottomRef: HTMLDivElement;
  let chatContainer: HTMLDivElement;

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
    body,
    onLoading: () => {
      bottomRef.scrollIntoView({ behavior: "instant" });
    },
    onError: (e) => {
      toast.error(e.message);
    },
    onFinish: (message) => {
      appendMessage({ ...message, revisionId: revision.id }, message.attachments);
    },
    onMessageUpdate: (messages) => {
      if (checkIfUserIsNearBottom()) {
        bottomRef.scrollIntoView({ behavior: "instant" });
      }
    },
  });

  function checkIfUserIsNearBottom() {
    if (!chatContainer) return false;
    const threshold = 0.05; // 1% from the bottom
    const position = chatContainer.scrollTop + chatContainer.clientHeight;
    const height = chatContainer.scrollHeight;
    console.log(
      "checkIfUserIsNearBottom",
      position,
      height,
      threshold,
      (height - position) / height,
    );
    return (height - position) / height < threshold;
  }

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
    await appendMessage(
      { id: nanoid(10), role: "user", content: value, revisionId: revision.id },
      attachments,
    );
    Object.assign(body, {
      providerId: model.service.providerId,
      modelName: model.name,
      baseURL: model.service.baseURL,
      apiKey: model.service.apiKey,
    });
    console.log("calling chat.handleSubmit", value);
    chatService.input = value;
    chatService.attachments = attachments;
    chatService.handleSubmit();
    return true;
  }
</script>

<ChatTitlebar {chat} {revision} tab="chat" />
<div class="flex flex-1 flex-col overflow-y-auto" bind:this={chatContainer}>
  <div class="flex flex-1 flex-col gap-2 p-4">
    {#each chatService.messages as message (message.id)}
      <MessageCard {message} />
    {/each}
    {#if chatService.isLoading}
      <RobotLoader />
    {/if}
    <div bind:this={bottomRef}></div>
  </div>
  <MessageInput onSubmit={handleSubmit} />
</div>
