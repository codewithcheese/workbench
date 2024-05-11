<script lang="ts">
  import { TrashIcon } from "lucide-svelte";
  import { Button } from "@/components/ui/button/index.js";
  import * as Dialog from "@/components/ui/dialog/index.js";

  function capitalizeWords(text: string): string {
    return text
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  type Props = {
    name: string;
    type: "project" | "document";
    onConfirm: () => void;
    onCancel: () => void;
  };
  let { name, type, onConfirm, onCancel }: Props = $props();
</script>

<Dialog.Root open onOpenChange={onCancel}>
  <Dialog.Trigger asChild let:builder>
    <Button
      builders={[builder]}
      variant="ghost"
      class="p-1 px-4 text-sm opacity-0 group-hover:opacity-100"
    >
      <TrashIcon class="h-4 w-4" />
    </Button>
  </Dialog.Trigger>
  <Dialog.Content class="max-w-[400px]">
    <Dialog.Title>Delete {capitalizeWords(type)}</Dialog.Title>
    <Dialog.Description class="space-y-2">
      <p>Are you sure you want to delete this {type}?</p>
      <p>
        {capitalizeWords(type)} to be deleted: <span class="font-semibold">{name}</span>
      </p>
      <p>This action cannot be undone.</p>
    </Dialog.Description>
    <Dialog.Close>
      <Button
        class="w-full"
        variant="destructive"
        onclick={() => {
          onConfirm();
        }}
      >
        Delete
      </Button>
    </Dialog.Close>
  </Dialog.Content>
</Dialog.Root>
