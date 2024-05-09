<script lang="ts">
  import { ClipboardIcon } from "lucide-svelte";
  import { Button } from "@/components/ui/button";
  import { toast } from "svelte-french-toast";
  import { cn } from "$lib/cn";

  type Props = {
    value: string;
    class: string;
  };
  let { value, class: className = $bindable("") }: Props = $props();

  let isSuccess: boolean = $state(false);

  async function handleClick() {
    // console.log("Copying to clipboard", value);
    try {
      await navigator.clipboard.writeText(value);
      isSuccess = true;
    } catch (err) {
      console.error(err);
    }
  }

  $effect(() => {
    if (isSuccess) {
      toast.success("Copied to clipboard");
      isSuccess = false;
    }
  });
</script>

<Button
  variant="outline"
  class={cn("p-2", className)}
  title={"Copy to clipboard"}
  onclick={handleClick}
>
  <ClipboardIcon size={16} />
</Button>
