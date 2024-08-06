<script lang="ts">
  import { onMount } from "svelte";
  import { Card, CardContent } from "@/components/ui/card";
  import { Button } from "@/components/ui/button";
  import { Textarea } from "@/components/ui/textarea";
  import {
    Send,
    Plus,
    HardDriveUpload,
    CloudUpload,
    Clipboard,
    SendIcon,
    BanIcon,
  } from "lucide-svelte";
  import Attachment from "./Attachment.svelte";
  import type { MessageAttachment } from "$lib/chat-service.svelte";
  import { nanoid } from "nanoid";
  import AttachmentControls from "./AttachmentControls.svelte";
  import { compressImage } from "$lib/image";
  import { toast } from "svelte-french-toast";

  type Props = {
    isLoading: boolean;
    onSubmit: (content: string, attachments: MessageAttachment[]) => Promise<boolean>;
  };
  let { isLoading, onSubmit }: Props = $props();
  let isUploadOpen = $state(false);
  let textareaElement: HTMLTextAreaElement;
  let content = $state("");
  let attachments = $state<MessageAttachment[]>([]);
  let disabled = $derived(content === "" && attachments.length === 0);

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
    const submit = await onSubmit(content, attachments);
    if (submit) {
      content = "";
      attachments = [];
    }
  }

  async function handlePaste(event: ClipboardEvent) {
    try {
      if (!event.clipboardData) {
        return;
      }
      console.time("handlePaste");
      const content = event.clipboardData.getData("text/plain");
      if (content.length > 1000) {
        event.preventDefault();
        attachments.push({
          id: nanoid(10),
          type: "pasted",
          name: `Pasted ${new Date().toLocaleString()}`,
          content,
          attributes: {},
        });
      }

      // Handle image paste
      const items = Array.from(event.clipboardData.items);
      const imageItem = items.find((item) => item.type.indexOf("image") !== -1);

      if (imageItem) {
        event.preventDefault();
        let blob = imageItem.getAsFile() as Blob;
        if (blob) {
          const originalSizeMB = blob.size / (1024 * 1024);
          if (originalSizeMB > 10) {
            return toast.error(`Image too large: ${originalSizeMB.toFixed(2)} MB. `);
          }
          console.log(`Original image size: ${originalSizeMB.toFixed(2)} MB`);
          if (originalSizeMB > 0.5) {
            blob = await compressImage(blob);
            const compressedSizeMB = blob.size / (1024 * 1024);
            toast.success(
              `Large image compressed from ${originalSizeMB.toFixed(2)} MB to ${compressedSizeMB.toFixed(2)} MB`,
            );
          }
          const reader = new FileReader();
          reader.onload = function (e) {
            const base64data = e.target?.result as string;
            attachments.push({
              id: nanoid(10),
              type: blob.type,
              name: `Image ${new Date().toLocaleString()}`,
              content: base64data,
              attributes: {
                size: blob.size,
                type: blob.type,
              },
            });
          };
          reader.readAsDataURL(blob);
        }
      }
    } finally {
      console.timeEnd("handlePaste");
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
        <AttachmentControls />
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
          class="prose max-h-[200px] min-h-1 flex-1 resize-none overflow-y-auto border-none bg-muted/50 focus-visible:ring-0"
          onkeydown={handleKeydown}
          onpaste={handlePaste}
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
