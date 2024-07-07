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
  import { useChat } from "$lib/ai/use-chat.svelte";
  import { toast } from "svelte-french-toast";

  let { data } = $props();

  let body = $state<{ providerId?: string; modelName?: string; baseURL?: string; apiKey?: string }>(
    {
      providerId: undefined,
      modelName: undefined,
      baseURL: undefined,
      apiKey: undefined,
    },
  );

  let chat = useChat({
    // @ts-expect-error message type mismatch
    initialMessages: data.response.messages,
    editing: getEditing(),
    body,
    onError: (e) => {
      toast.error(e.message);
    },
    onFinish: (message) => {
      updateMessages(data.response.id, $state.snapshot(chat.messages));
    },
  });

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

  function getEditing() {
    const editingIndex = data.response.messages.findLastIndex((m) => m.role === "user");
    if (editingIndex === -1) {
      return undefined;
    } else {
      return { index: editingIndex };
    }
  }

  // function getUserMessage() {
  //   let message = chat.messages.findLast((m) => m.role === "user");
  //   if (!message) {
  //     message = {
  //       id: nanoid(),
  //       role: "user",
  //       content: "",
  //     };
  //     chat.messages.push(message);
  //   }
  //   return message;
  // }
  //
  function getAssistantMessage() {
    let editing = getEditing();
    if (!editing) {
      return undefined;
    }
    if (editing) {
      return chat.messages.find((m, index) => m.role === "assistant" && index > editing.index);
    }
  }

  async function handleSubmit() {
    // const message = chat.messages.find((m) => m.id === userMessage.id);
    // if (!store.selected.modelId) {
    //   toast.error("No model selected");
    //   return;
    // }
    // const model = await getModelService(store.selected.modelId);
    // if (!model) {
    //   toast.error("Selected model not found");
    //   return;
    // }
    // Object.assign(body, {
    //   providerId: model.service.providerId,
    //   modelName: model.name,
    //   baseURL: model.service.baseURL,
    //   apiKey: model.service.apiKey,
    // });
    // message.content = prompt;
    // chat.reload();
  }

  async function onChange() {
    // input$.next(prompt);
  }
</script>

<div class="grid grid-cols-2 gap-3 overflow-y-auto px-4">
  <div class="overflow-y-auto py-4">
    <EditorCard bind:prompt={chat.input} chat={data.chat} {onChange} />
    <Button class="my-2 px-2" variant="default" onclick={handleSubmit}>
      <Send class="h-4 w-4" />
      <div
        class="w-13 pointer-events-none ml-2 hidden h-6 rounded-full bg-gray-700 px-2 py-1 md:inline-flex"
      >
        <div class="pointer-events-none text-center text-xs font-light text-white">Ctrl + ⏎</div>
      </div>
    </Button>
  </div>
  <div class="flex flex-col gap-3 py-4">
    {#if assistantMessage}
      <MessageCard message={assistantMessage} />
    {/if}
  </div>
</div>
