<script>
  import Splash from "@/components/Splash.svelte";
  import { page } from "$app/stores";
</script>

<Splash>
  <div class="text-4xl">{$page.status ? $page.status : 500}</div>
  <p>{$page.error ? $page.error.message : "Unknown error occurred"}</p>
</Splash>
