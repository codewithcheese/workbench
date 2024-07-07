<script lang="ts">
  import { ChatService } from "$lib/ai/use-chat.svelte";
  import { toast } from "svelte-french-toast";
  import { updateMessages } from "./revise/$data";
  import MessageInput from "./MessageInput.svelte";
  import { store } from "$lib/store.svelte";
  import { getModelService } from "./$data";
  import type { ResponseMessage } from "@/database";
  import MessageCard from "./MessageCard.svelte";

  type Props = {
    responseId: string;
    messages: ResponseMessage[];
  };
  let { responseId, messages }: Props = $props();
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
      updateMessages(responseId, $state.snapshot(chatService.messages));
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

<div class="flex flex-1 flex-col gap-2 p-4">
  {#each chatService.messages as message (message.id)}
    <MessageCard {message} />
  {/each}
  <div bind:this={bottomRef} id="bottom-anchor"></div>
</div>
<MessageInput onSubmit={handleSubmit} />
