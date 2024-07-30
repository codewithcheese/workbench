<script lang="ts">
  import { type MessageAttachment, ChatService } from "$lib/chat-service.svelte.js";
  import { toast } from "svelte-french-toast";
  import MessageInput from "./MessageInput.svelte";
  import { store } from "$lib/store.svelte";
  import {
    appendMessages,
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
  import { goto } from "$app/navigation";
  import { route } from "$lib/route";

  type Props = {
    chat: Chat & { revisions: Revision[] };
    revision: RevisionView;
  };
  let { chat, revision }: Props = $props();
  console.log("ChatPage", chat, revision);
  let autoScroller = new AutoScroller();
  let saveLength = $state(revision.messages.length);

  let chatService = new ChatService({
    id: chat.id,
    version: revision.version,
    initialMessages: revision.messages.map(toChatMessage),
    onLoading: () => {
      autoScroller.onLoading();
    },
    onError: (e) => {
      toast.error(e.message);
    },
    onFinish: async (message) => {
      if (chatService.hasEdits) {
        console.log("onFinish", "Creating new revision");
        // save as new revision
        const newRevision = await createRevision(chat.id, $state.snapshot(chatService.messages));
        if (!newRevision) {
          return toast.error("Failed to create revision");
        }
        await goto(route(`/chat/[id]`, { id: chat.id, $query: { version: newRevision.version } }));
      } else {
        console.log("onFinish", "Appending to existing revision");
        const unsaved = chatService.messages.slice(saveLength);
        await appendMessages(revision.id, unsaved);
        saveLength = chatService.messages.length;
      }
      chatService.markAsSaved();
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
    }
    if (!revision) {
      toast.error("Failed to create revision");
      return false;
    }
    chatService.messages.push({
      id: nanoid(10),
      role: "user",
      content: value,
      attachments,
    });
    await chatService.submit({
      options: {
        body: {
          providerId: model.service.providerId,
          modelName: model.name,
          baseURL: model.service.baseURL,
          apiKey: model.service.apiKey,
        },
      },
    });
    return true;
  }
</script>

<ChatTitlebar {chat} {revision} tab="chat" unsavedChanges={chatService.hasEdits} />
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
