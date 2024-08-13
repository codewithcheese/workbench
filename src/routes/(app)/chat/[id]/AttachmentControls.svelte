<script lang="ts">
  import { Clipboard, HardDriveUpload } from "lucide-svelte";
  import { Button } from "@/components/ui/button/index.js";

  type Props = {
    onUploadClick?: () => void;
    onPasteClick?: () => void;
  };
  let { onUploadClick = () => {}, onPasteClick = () => {} }: Props = $props();
</script>

<div class="flex items-center justify-start gap-2">
  <Button variant="outline" size="sm" on:click={onUploadClick}>
    <HardDriveUpload class="mr-2 h-4 w-4" />
    Upload
  </Button>
  <!--  <Button variant="outline" size="sm" on:click={() => handleUpload("Drive")}>-->
  <!--    <CloudUpload class="mr-2 h-4 w-4" />-->
  <!--    Drive-->
  <!--  </Button>-->
  <Button variant="outline" size="sm" on:click={onPasteClick}>
    <Clipboard class="mr-2 h-4 w-4" />
    Paste
  </Button>
</div>
