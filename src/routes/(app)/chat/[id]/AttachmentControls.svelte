<script lang="ts">
  import { Clipboard } from "lucide-svelte";
  import { Button } from "@/components/ui/button/index.js";

  type Props = {
    onPaste?: () => void;
  };
  let { onPaste = () => {} }: Props = $props();
</script>

<div class="flex items-center justify-start gap-2">
  <!--  <Button variant="outline" size="sm" on:click={() => handleUpload("Browse")}>-->
  <!--    <HardDriveUpload class="mr-2 h-4 w-4" />-->
  <!--    Browse-->
  <!--  </Button>-->
  <!--  <Button variant="outline" size="sm" on:click={() => handleUpload("Drive")}>-->
  <!--    <CloudUpload class="mr-2 h-4 w-4" />-->
  <!--    Drive-->
  <!--  </Button>-->
  <Button variant="outline" size="sm" on:click={() => onPaste()}>
    <Clipboard class="mr-2 h-4 w-4" />
    Paste
  </Button>
</div>
