<script lang="ts">
  import { page } from "$app/stores";
  import ChatPage from "./ChatPage.svelte";

  let { data } = $props();
</script>

{#key ($page.params.id, data.version)}
  <ChatPage chat={data.chat} revision={data.revision} />
{/key}
