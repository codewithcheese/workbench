<script lang="ts">
  import { page } from "$app/stores";
  import RevisePage from "./RevisePage.svelte";

  let { data } = $props();
</script>

{#key ($page.params.id, data.version)}
  <RevisePage chat={data.chat} revision={data.revision} />
{/key}
