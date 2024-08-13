<script lang="ts">
  import { page } from "$app/stores";
  import ChatPage from "./ChatPage.svelte";
  import { setContext } from "svelte";

  let { data } = $props();
  setContext("documentServices", data.documentServices);
</script>

{#key $page.params.id}
  {#key data.version}
    <ChatPage chat={data.chat} revision={data.revision} />
  {/key}
{/key}
