<script lang="ts">
  import { page } from "$app/stores";
  import ChatPage from "./ChatPage.svelte";

  let { data } = $props();
</script>

{#key $page.params.id}
  <ChatPage chat={data.chat} responseId={data.response.id} messages={data.response.messages} />
{/key}
