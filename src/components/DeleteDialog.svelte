<script lang="ts">
  import { TrashIcon } from "lucide-svelte";
  import { Button } from "@/components/ui/button/index.js";
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog";

  function capitalizeWords(text: string): string {
    return text
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  type Props = {
    open: boolean;
    name: string;
    type: "chat" | "document";
    onConfirm: () => void;
    onOpenChange: (open: boolean) => void;
  };
  let { open, name, type, onConfirm, onOpenChange }: Props = $props();
</script>

<Dialog {open} {onOpenChange}>
  <DialogTrigger asChild let:builder>
    <Button
      builders={[builder]}
      variant="ghost"
      class="p-1 px-4 text-sm opacity-0 group-hover:opacity-100"
    >
      <TrashIcon class="h-4 w-4" />
    </Button>
  </DialogTrigger>
  <DialogContent class="max-w-[400px]">
    <DialogTitle>Delete {capitalizeWords(type)}</DialogTitle>
    <DialogDescription class="space-y-2">
      <p>Are you sure you want to delete this {type}?</p>
      <p>
        {capitalizeWords(type)} to be deleted: <span class="font-semibold">{name}</span>
      </p>
      <p>This action cannot be undone.</p>
    </DialogDescription>
    <DialogFooter>
      <Button
        class="w-full"
        variant="destructive"
        onclick={() => {
          onConfirm();
        }}
      >
        Delete
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
