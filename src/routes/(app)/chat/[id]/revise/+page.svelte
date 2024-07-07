<script lang="ts">
  import EditorCard from "./EditorCard.svelte";
  import ResponseCard from "./ResponseCard.svelte";
  import { insertResponseMessage, updateMessages, updateResponseMessage } from "./$data";
  import { nanoid } from "nanoid";
  import { invalidate } from "$app/navigation";
  import { concatMap, Subject, throttleTime } from "rxjs";
  import type { ResponseMessage } from "@/database";
  import MessageCard from "../MessageCard.svelte";
  import { getModelService, submitPrompt } from "../$data";
  import { store } from "$lib/store.svelte";
  import { Button } from "@/components/ui/button";
  import { PlayIcon, Send, SendIcon } from "lucide-svelte";
  import { ChatService } from "$lib/chat-service.svelte.js";
  import { toast } from "svelte-french-toast";
  import ChatTitlebar from "../ChatTitlebar.svelte";

  let { data } = $props();

  let editIndex = findEditIndex();

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
    initialMessages: data.response.messages,
    editing: editIndex ? { index: editIndex } : undefined,
    body,
    onError: (e) => {
      toast.error(e.message);
    },
    onFinish: (message) => {
      console.log("onFinish", message);
      // updateMessages(data.response.id, $state.snapshot(chatService.messages));
    },
  });

  $inspect("input", chatService.input);

  let assistantMessage = $derived(getAssistantMessage());

  // let userMessage = $derived(getUserMessage());
  // let assistantMessage = $derived(userMessage ? getAssistantMessage(userMessage) : null);
  // // problem: cannot bind content since codemirror resets cursor position when content is updated by loader
  // // solution: uncontrolled prompt using state, does not update until navigation
  // let prompt = $state(userMessage ? userMessage.content : "");
  //
  // $inspect("revise", data.response.messages, userMessage, assistantMessage, prompt);
  //
  // const input$ = new Subject();
  // input$
  //   .pipe(
  //     throttleTime(100, undefined, { leading: true, trailing: true }),
  //     concatMap(async (newValue) => {
  //       if (userMessage) {
  //         await updateResponseMessage(userMessage.id, { content: newValue });
  //       } else {
  //         await insertResponseMessage({
  //           id: nanoid(),
  //           responseId: data.response.id,
  //           role: "user",
  //           content: newValue,
  //         });
  //       }
  //       // will reload messages so that next change will update instead of creating a new message.
  //       await invalidate("view:messages");
  //     }),
  //   )
  //   .subscribe();
  //
  // function getNextIndex() {
  //   const nextIndex = data.response.messages.length
  //     ? data.response.messages.reduce((localMax, curr) => Math.max(localMax, curr.index), 0) + 1
  //     : 0;
  //   console.log("nextIndex", data.response.messages.length, nextIndex);
  //   return nextIndex;
  // }

  function findEditIndex() {
    const editIndex = data.response.messages.findLastIndex((m) => m.role === "user");
    return editIndex === -1 ? undefined : editIndex;
  }

  function getAssistantMessage() {
    return editIndex
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
      {#if !editIndex || index < editIndex}
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
