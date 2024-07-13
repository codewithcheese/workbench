<script lang="ts">
  import { onMount } from "svelte";
  import { Card, CardContent } from "@/components/ui/card";
  import { Button } from "@/components/ui/button";
  import { Textarea } from "@/components/ui/textarea";
  import { Send, Plus, HardDriveUpload, CloudUpload, Clipboard } from "lucide-svelte";
  import type { AttachmentInput } from "./$data";
  import Attachment from "./Attachment.svelte";

  type Props = {
    onSubmit: (content: string, attachments: AttachmentInput[]) => Promise<boolean>;
  };
  let { onSubmit }: Props = $props();
  let isUploadOpen = $state(false);
  let textareaElement: HTMLTextAreaElement;
  let content = $state("");
  let attachments = $state<AttachmentInput[]>([]);

  function resize() {
    textareaElement.style.height = "auto";
    textareaElement.style.height = `${textareaElement.scrollHeight}px`;
  }

  function handleUpload(type: string) {
    console.log(`Uploading from ${type}`);
    isUploadOpen = false;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }

  async function handleSubmit() {
    console.log("handleSubmit", content);
    if (await onSubmit(content, attachments)) {
      content = "";
      attachments = [];
    }
  }

  function handlePaste(event: ClipboardEvent) {
    if (!event.clipboardData) {
      return;
    }
    const content = event.clipboardData.getData("text/plain");
    if (content.length > 1000) {
      event.preventDefault();
      attachments.push({ type: "pasted", content });
    }
  }

  function toggleUploadOptions() {
    isUploadOpen = !isUploadOpen;
  }

  onMount(() => {
    textareaElement.focus();
  });
</script>

<div class="sticky bottom-0 mx-auto w-full max-w-3xl">
  <Card class="w-full rounded-b-none border-b-0">
    <CardContent class="flex flex-col gap-3 p-4">
      {#if attachments.length > 0}
        <div class="flex max-w-full flex-row gap-2 overflow-y-auto">
          {#each attachments as attachment, index (index)}
            <Attachment
              type={attachment.type}
              content={attachment.content}
              onRemove={() => (attachments = attachments.filter((a, i) => i !== index))}
            />
          {/each}
        </div>
      {/if}
      {#if isUploadOpen}
        <div class="flex items-center justify-start gap-2">
          <Button variant="outline" size="sm" on:click={() => handleUpload("Browse")}>
            <HardDriveUpload class="mr-2 h-4 w-4" />
            Browse
          </Button>
          <Button variant="outline" size="sm" on:click={() => handleUpload("Drive")}>
            <CloudUpload class="mr-2 h-4 w-4" />
            Drive
          </Button>
          <Button variant="outline" size="sm" on:click={() => handleUpload("Paste")}>
            <Clipboard class="mr-2 h-4 w-4" />
            Paste
          </Button>
        </div>
      {/if}
      <div class="flex items-end gap-2">
        <Button variant="outline" size="icon" on:click={toggleUploadOptions}>
          <Plus class="h-4 w-4" />
        </Button>
        <Textarea
          bind:element={textareaElement}
          placeholder="What's on your mind?"
          bind:value={content}
          oninput={resize}
          class=" max-h-[200px] min-h-1 flex-1 resize-none overflow-y-auto border-none bg-muted/50 focus-visible:ring-0"
          onkeydown={handleKeydown}
          onpaste={handlePaste}
        />
        <Button variant="default" size="icon" onclick={handleSubmit}>
          <Send class="h-4 w-4" />
        </Button>
      </div>
    </CardContent>
  </Card>
</div>
