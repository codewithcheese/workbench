<script lang="ts">
  import MessageCard from "../MessageCard.svelte";
  import {
    appendMessages,
    createRevision,
    getModelService,
    type RevisionView,
    toChatMessage,
  } from "../$data";
  import { store } from "$lib/store.svelte";
  import { ChatService } from "$lib/chat-service.svelte.js";
  import { toast } from "svelte-french-toast";
  import ChatTitlebar from "../ChatTitlebar.svelte";
  import { goto } from "$app/navigation";
  import type { Chat, Revision } from "@/database";
  import RobotLoader from "@/components/RobotLoader.svelte";
  import { AutoScroller } from "$lib/auto-scroller";
  import { nanoid } from "nanoid";
  import { Button } from "@/components/ui/button";
  import { PlusIcon, ReplyIcon, SquarePlusIcon, Trash2Icon } from "lucide-svelte";
  import { Card, CardContent, CardFooter } from "@/components/ui/card";
  import MessageEditor from "../MessageEditor.svelte";
  import { onMount, tick } from "svelte";
  import MessageMarkdown from "./MessageMarkdown.svelte";
  import { getClipboardContent } from "$lib/clipboard";
  import { cn } from "$lib/cn";
  import MessageDivider from "./MessageDivider.svelte";
  import { route } from "$lib/route";

  type Props = {
    chat: Chat & { revisions: Revision[] };
    revision: RevisionView;
  };
  let { chat, revision }: Props = $props();
  let saveLength = $state(revision.messages.length);
  let autoScroller = new AutoScroller(true);
  let messagesContainer: HTMLDivElement;
  let highlightedForRemoval = $state<Record<number, boolean>>({});

  let chatService = new ChatService({
    id: chat.id,
    version: revision ? revision.version : 1,
    initialMessages: revision.messages.map(toChatMessage),
    onLoading: () => {
      autoScroller.onLoading();
    },
    onError: (e) => {
      toast.error(e.message);
    },
    onAppend: async () => {
      console.log("onAppend", "Appending to existing revision");
      const unsaved = chatService.messages.slice(saveLength);
      await appendMessages(revision.id, unsaved);
      saveLength = chatService.messages.length;
      chatService.markAsSaved();
    },
    onRevision: async () => {
      console.log("onRevision", "Creating new revision");
      // save as new revision
      const newRevision = await createRevision(chat.id, $state.snapshot(chatService.messages));
      if (!newRevision) {
        return toast.error("Failed to create revision");
      }
      await goto(
        route(`/chat/[id]/revise`, { id: chat.id, $query: { version: newRevision.version } }),
      );
      chatService.markAsSaved();
    },
    onMessageUpdate: () => {
      autoScroller.onMessageUpdate();
    },
  });

  let haveResponse = $derived(
    chatService.messages.length > 0 &&
      chatService.messages[chatService.messages.length - 1].role === "assistant",
  );

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
    // if last message is assistant, replace it with new response
    const lastMessage = chatService.messages[chatService.messages.length - 1];
    if (lastMessage && lastMessage.role === "assistant") {
      chatService.messages.pop();
    }
    return chatService.submit({
      options: {
        body: {
          providerId: model.service.providerId,
          modelName: model.name,
          baseURL: model.service.baseURL,
          apiKey: model.service.apiKey,
        },
      },
    });
  }

  onMount(() => {
    if (chatService.messages.length === 0) {
      chatService.messages.push({
        id: nanoid(10),
        role: "user",
        content: "",
        attachments: [],
      });
    }
  });

  async function handlePaste(index: number) {
    const clip = await getClipboardContent();
    if (clip.error !== null) {
      toast.error(clip.error);
      return;
    }
    const attachments = chatService.messages[index].attachments;
    attachments.push({
      id: nanoid(10),
      type: "pasted",
      name: `Pasted ${new Date().toLocaleString()}`,
      content: clip.content,
      attributes: {},
    });
  }

  async function handleRemoveAttachment(messageIndex: number, attachmentIndex: number) {
    chatService.messages[messageIndex].attachments.splice(attachmentIndex, 1);
  }

  async function handleAddToConversation() {
    chatService.messages.push({
      id: nanoid(10),
      role: "user",
      content: "",
      attachments: [],
    });
    await tick();
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    document
      .getElementById(`message-editor-${chatService.messages[chatService.messages.length - 1].id}`)
      ?.focus();
  }

  function handleRemove(index: number) {
    chatService.messages.splice(index, 1);
  }

  function handleInsertMessage(index: number) {
    let role: "user" | "assistant" | "system" = "user";
    const current = index === -1 ? "none" : chatService.messages[index].role;
    switch (current) {
      case "user":
        role = "assistant";
        break;
      case "system":
        role = "user";
        break;
      default:
        role = "user";
    }

    chatService.messages.splice(index + 1, 0, {
      id: nanoid(10),
      role,
      content: "",
      attachments: [],
    });
  }
</script>

<ChatTitlebar
  {chat}
  {revision}
  tab="revise"
  onRunClick={handleSubmit}
  unsavedChanges={chatService.hasEdits}
/>
<div class="grid flex-1 grid-cols-2 gap-3 overflow-y-auto px-4">
  <div class="flex flex-col overflow-y-auto" bind:this={messagesContainer}>
    <MessageDivider
      index={-1}
      warning={chatService.messages.length > 0 && chatService.messages[0].role === "assistant"
        ? "Some AI providers (e.g. Anthropic) require the first message to be a user message"
        : ""}
      {handleInsertMessage}
    />
    {#each chatService.messages as message, index (message.id)}
      {@const showWarning =
        index < chatService.messages.length - 1 &&
        chatService.messages[index + 1].role === chatService.messages[index].role}
      {#if message.role !== "assistant" || index < chatService.messages.length - 1}
        <MessageCard
          {index}
          bind:message={chatService.messages[index]}
          editable={true}
          highlightedForRemoval={highlightedForRemoval[index] || false}
          onPaste={() => handlePaste(index)}
          onSubmit={handleSubmit}
          onRemove={() => handleRemove(index)}
          onRemoveAttachment={(attachmentIndex) => handleRemoveAttachment(index, attachmentIndex)}
        />
        <MessageDivider
          {index}
          showOnHover={true}
          warning={showWarning
            ? "Some AI providers (e.g. Anthropic) require messages that alternate between user & assistant"
            : undefined}
          {handleInsertMessage}
        />
      {/if}
    {/each}
    <div id="messages-end" class="py-4">&nbsp;</div>
  </div>
  <div class="flex flex-col gap-3 overflow-hidden">
    <Card
      class={cn(
        "mb-4 flex h-full flex-col overflow-hidden hover:border hover:border-gray-300",
        haveResponse && highlightedForRemoval[chatService.messages.length - 1] && "border-red-500",
      )}
    >
      <CardContent class="overflow-y-auto p-0" action={autoScroller.action}>
        {#if haveResponse}
          <div class="flex flex-row justify-end">
            <Button
              class="h-fit w-fit p-1 text-gray-500 hover:text-black"
              variant="ghost"
              size="icon"
              onclick={() => handleRemove(chatService.messages.length - 1)}
            >
              <Trash2Icon class="h-4 w-4" />
            </Button>
          </div>
          <div class="px-4 pb-4">
            {#if chatService.isLoading}
              <MessageMarkdown
                content={chatService.messages[chatService.messages.length - 1].content}
              />
              <RobotLoader />
            {:else}
              <MessageEditor
                id={chatService.messages[chatService.messages.length - 1].id}
                content={chatService.messages[chatService.messages.length - 1].content}
                onChange={(content) => {
                  chatService.messages[chatService.messages.length - 1].content = content;
                }}
              />
            {/if}
          </div>
        {/if}
      </CardContent>
      <CardFooter class="p-3">
        {#if haveResponse}
          <div class="sticky bottom-0">
            <Button variant="outline" onclick={handleAddToConversation}>
              <ReplyIcon class="mr-2 h-4 w-4" />
              Add to conversation
            </Button>
          </div>
        {/if}
      </CardFooter>
    </Card>
  </div>
</div>
