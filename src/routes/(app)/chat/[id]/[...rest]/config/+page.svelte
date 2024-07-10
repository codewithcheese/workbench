<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { route } from "$lib/route";

  let { data } = $props();

  if (data.services.length > 0) {
    goto(route(`/chat/[id]/[...rest]/config/select`, { id: $page.params.id, rest: "" }));
  } else {
    goto(route(`/chat/[id]/[...rest]/config/create`, { id: $page.params.id, rest: "" }));
  }
</script>
