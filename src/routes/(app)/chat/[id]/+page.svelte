<script lang="ts">
  import { page } from "$app/stores";
  import ChatPage from "./ChatPage.svelte";

  let { data } = $props();
</script>

{#key $page.params.id}
  {#key data.version}
    <ChatPage chat={data.chat} revision={data.revision} />
  {/key}
{/key}
