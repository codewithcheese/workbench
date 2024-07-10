<script lang="ts">
  import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
  import { DialogHeader } from "@/components/ui/dialog/index.js";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { route } from "$lib/route";

  let { data } = $props();
</script>

<Dialog
  open={true}
  onOpenChange={(isOpen) => {
    if (!isOpen) {
      goto(
        route(`/chat/[id]`, { id: $page.params.id, $query: { version: data.revision.version } }),
      );
    }
  }}
>
  <DialogTrigger id="model-config-trigger"></DialogTrigger>
  <DialogContent class="max-h-screen overflow-y-auto sm:max-w-[425px]">
    <slot />
  </DialogContent>
</Dialog>
