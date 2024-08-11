<script lang="ts">
  import { getContext, onMount } from "svelte";
  import { Card, CardContent } from "@/components/ui/card";
  import { Button } from "@/components/ui/button";
  import { Textarea } from "@/components/ui/textarea";
  import { BanIcon, Plus, SendIcon } from "lucide-svelte";
  import Attachment from "./Attachment.svelte";
  import type { MessageAttachment } from "$lib/chat-service.svelte";
  import AttachmentControls from "./AttachmentControls.svelte";
  import { AttachmentService } from "$lib/attachment-service.svelte";
  import type { Service } from "@/database";

  type Props = {
    isLoading: boolean;
    onSubmit: (content: string, attachments: MessageAttachment[]) => Promise<boolean>;
  };
  let { isLoading, onSubmit }: Props = $props();
  let documentServices: Service[] = getContext("documentServices");
  console.log("documentServices", documentServices);
  let attachmentService = new AttachmentService(documentServices);
  let isUploadOpen = $state(false);
  let textareaElement: HTMLTextAreaElement;
  let content = $state("");
  let disabled = $derived(
    content === "" &&
      (attachmentService.attachments.length === 0 ||
        attachmentService.attachments.filter((a) => a.loading).length > 0),
  );

  function resize() {
    textareaElement.style.height = "auto";
    textareaElement.style.height = `${textareaElement.scrollHeight}px`;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }

  async function handleSubmit() {
    const submit = await onSubmit(content, attachmentService.attachments);
    if (submit) {
      content = "";
      attachmentService.clear();
    }
  }

  function toggleUploadOptions() {
    isUploadOpen = !isUploadOpen;
  }

  function onFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (!target.files) {
      return;
    }
    const fileList = Array.from(target.files);
    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const content = e.target?.result;
        // Here you would typically send the file content to a server
        // For this example, we'll just log it to the console
        console.log(`Uploading ${file.name}...`);
        console.log(content);
      };
      reader.readAsDataURL(file);
    });
  }

  onMount(() => {
    textareaElement.focus();
  });
</script>

<div class="sticky bottom-0 mx-auto w-full max-w-3xl">
  <Card class="w-full rounded-b-none border-b-0">
    <CardContent class="flex flex-col gap-3 p-4">
      {#if attachmentService.attachments.length > 0}
        <div class="flex max-w-full flex-row gap-2 overflow-y-auto">
          {#each attachmentService.attachments as attachment, index (index)}
            <Attachment {attachment} onRemove={() => attachmentService.remove(index)} />
          {/each}
        </div>
      {/if}
      {#if isUploadOpen}
        <AttachmentControls
          onPasteClick={attachmentService.handlePasteClick}
          onUploadClick={attachmentService.handleUploadClick}
        />
      {/if}
      <div class="flex items-end gap-2">
        <Button variant="outline" size="icon" onclick={toggleUploadOptions}>
          <Plus class="h-4 w-4" />
        </Button>
        <input type="file" bind:this={attachmentService.fileInput} onchange={onFileChange} hidden />
        <Textarea
          bind:element={textareaElement}
          placeholder="What's on your mind?"
          bind:value={content}
          oninput={resize}
          class="prose max-h-[200px] min-h-1 flex-1 resize-none overflow-y-auto border-none bg-muted/50 focus-visible:ring-0"
          onkeydown={handleKeydown}
          onpaste={attachmentService.handlePaste}
        />
        <Button variant="default" size="icon" {disabled} onclick={handleSubmit}>
          {#if isLoading}
            <BanIcon class="h-4 w-4" />
          {:else}
            <SendIcon class="h-4 w-4" />
          {/if}
        </Button>
      </div>
    </CardContent>
  </Card>
</div>
