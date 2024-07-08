<script lang="ts">
  import { ChatService } from "$lib/chat-service.svelte.js";
  import { toast } from "svelte-french-toast";
  import MessageInput from "./MessageInput.svelte";
  import { store } from "$lib/store.svelte";
  import { appendMessage, getModelService } from "./$data";
  import type { Chat, Message } from "@/database";
  import MessageCard from "./MessageCard.svelte";
  import ChatTitlebar from "./ChatTitlebar.svelte";
  import { nanoid } from "nanoid";

  type Props = {
    chat: Chat;
    revisionId: string;
    messages: Message[];
  };
  let { chat, revisionId, messages }: Props = $props();
  let bottomRef: HTMLDivElement;

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
    initialMessages: messages,
    body,
    onError: (e) => {
      toast.error(e.message);
    },
    onFinish: (message) => {
      appendMessage({ ...message, revisionId });
    },
    onMessageUpdate: (messages) => {
      bottomRef.scrollIntoView({ behavior: "smooth" });
    },
  });

  async function handleSubmit(value: string) {
    if (!store.selected.modelId) {
      toast.error("No model selected");
      return;
    }
    const model = await getModelService(store.selected.modelId);
    if (!model) {
      toast.error("Selected model not found");
      return;
    }
    appendMessage({ id: nanoid(10), role: "user", content: value, revisionId });
    Object.assign(body, {
      providerId: model.service.providerId,
      modelName: model.name,
      baseURL: model.service.baseURL,
      apiKey: model.service.apiKey,
    });
    console.log("calling chat.handleSubmit", value);
    chatService.input = value;
    chatService.handleSubmit();
  }
</script>

<ChatTitlebar {chat} tab="chat" />
<div class="flex flex-1 flex-col gap-2 p-4">
  {#each chatService.messages as message (message.id)}
    <MessageCard {message} />
  {/each}
  <div bind:this={bottomRef} id="bottom-anchor"></div>
</div>
<MessageInput onSubmit={handleSubmit} />
