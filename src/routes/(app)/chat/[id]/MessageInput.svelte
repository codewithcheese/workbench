<script lang="ts">
  import { onMount } from "svelte";
  import { Card, CardContent } from "@/components/ui/card";
  import { Button } from "@/components/ui/button";
  import { Textarea } from "@/components/ui/textarea";
  import { Send, Plus, HardDriveUpload, CloudUpload, Clipboard } from "lucide-svelte";

  let message = $state("");
  let isUploadOpen = $state(false);
  let textareaElement: HTMLTextAreaElement;

  function handleSendMessage() {
    console.log("Sending message:", message);
    message = "";
  }

  function handleInput(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    message = textarea.value;
    adjustTextareaHeight();
  }

  function adjustTextareaHeight() {
    textareaElement.style.height = "auto";
    textareaElement.style.height = `${textareaElement.scrollHeight}px`;
  }

  function handleUpload(type: string) {
    console.log(`Uploading from ${type}`);
    isUploadOpen = false;
  }

  function toggleUploadOptions() {
    isUploadOpen = !isUploadOpen;
  }

  onMount(() => {
    adjustTextareaHeight();
  });

  $effect(() => {
    adjustTextareaHeight();
  });
</script>

<div class="mx-auto w-full max-w-3xl">
  <Card class="w-full rounded-b-none border-b-0">
    <CardContent class="p-4">
      {#if isUploadOpen}
        <div class="mb-4 flex items-center justify-start gap-2">
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
          placeholder="Type your message here..."
          value={message}
          on:input={handleInput}
          class="max-h-[200px] min-h-1 resize-none overflow-y-auto border-none bg-gray-100 focus-visible:ring-0"
        />
        <Button variant="default" size="icon" on:click={handleSendMessage}>
          <Send class="h-4 w-4" />
        </Button>
      </div>
    </CardContent>
  </Card>
</div>
