<script lang="ts">
  import MessageCard from "../MessageCard.svelte";
  import { createRevision, getModelService, type RevisionView, toChatMessage } from "../$data";
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
  import { ReplyIcon } from "lucide-svelte";
  import { Card, CardContent, CardFooter } from "@/components/ui/card";
  import MessageEditor from "../MessageEditor.svelte";
  import { tick } from "svelte";
  import MessageMarkdown from "./MessageMarkdown.svelte";
  import { getClipboardContent } from "$lib/clipboard";

  type Props = {
    chat: Chat & { revisions: Revision[] };
    revision?: RevisionView;
  };
  let { chat, revision }: Props = $props();
  let autoScroller = new AutoScroller(true);
  let messagesContainer: HTMLDivElement;

  let chatService = new ChatService({
    initialMessages:
      revision && revision.messages.length
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
      const newRevision = await createRevision(chat.id, $state.snapshot(chatService.messages));
      if (!newRevision) {
        return toast.error("Failed to create revision");
      }
      if (revision) {
        await goto(`/chat/${chat.id}/revise/?version=${newRevision.version}`, { noScroll: true });
      }
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
    return chatService.revise({
      providerId: model.service.providerId,
      modelName: model.name,
      baseURL: model.service.baseURL,
      apiKey: model.service.apiKey,
    });
  }

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
</script>

<ChatTitlebar {chat} {revision} tab="revise" onRunClick={handleSubmit} />
<div class="grid flex-1 grid-cols-2 gap-3 overflow-y-auto px-4">
  <div class="flex flex-col gap-2 overflow-y-auto" bind:this={messagesContainer}>
    {#each chatService.messages as message, index (message.id)}
      {#if chatService.messages[chatService.messages.length - 1].role === "assistant" ? index < chatService.messages.length - 1 : true}
        <MessageCard
          bind:message={chatService.messages[index]}
          editable={true}
          onPaste={() => handlePaste(index)}
          onSubmit={handleSubmit}
          onRemoveAttachment={(attachmentIndex) => handleRemoveAttachment(index, attachmentIndex)}
        />
      {/if}
    {/each}
    <div id="messages-end" class="py-4">&nbsp;</div>
  </div>
  <div class="flex flex-col gap-3 overflow-hidden">
    <Card class="mb-4 flex h-full flex-col overflow-hidden hover:border hover:border-gray-300">
      <CardContent class="overflow-y-auto p-4" action={autoScroller.action}>
        {#if haveResponse}
          <div>
            {#if chatService.isLoading}
              <MessageMarkdown
                content={chatService.messages[chatService.messages.length - 1].content}
              />
              <RobotLoader />
            {:else}
              <MessageEditor
                id={chatService.messages[chatService.messages.length - 1].id}
                bind:content={chatService.messages[chatService.messages.length - 1].content}
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
