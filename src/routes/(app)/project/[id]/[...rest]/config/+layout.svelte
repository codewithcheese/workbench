<script lang="ts">
  import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
  import { DialogHeader } from "@/components/ui/dialog/index.js";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
</script>

<Dialog
  open={true}
  onOpenChange={(isOpen) => {
    if (!isOpen) {
      goto(`/project/${$page.params.id}/revise`);
    }
  }}
>
  <DialogTrigger id="model-config-trigger"></DialogTrigger>
  <DialogContent class="max-h-screen overflow-y-auto sm:max-w-[425px]">
    <slot />
  </DialogContent>
</Dialog>
