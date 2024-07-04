<script lang="ts">
  import Menu from "./Menu.svelte";
  import { Toaster } from "svelte-french-toast";

  let { data } = $props();
</script>

<div class="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
  <div class="hidden border-r bg-muted/40 md:block">
    <div class="flex h-full max-h-screen flex-col gap-2">
      <Menu chats={data.chats} />
    </div>
  </div>
  <slot />
</div>
<Toaster />
