<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";

  let { data } = $props();

  if (data.services.length > 0) {
    goto(`/project/${$page.params.id}/config/select`);
  } else {
    goto(`/project/${$page.params.id}/config/create`);
  }
</script>
