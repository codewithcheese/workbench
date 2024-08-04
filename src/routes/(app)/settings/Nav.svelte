<script lang="ts">
  import { match, route } from "$lib/route";
  import { cn } from "$lib/cn";
  import { page } from "$app/stores";
</script>

<nav
  class="grid gap-4 text-sm text-muted-foreground"
  data-x-chunk-container="chunk-container after:right-0"
>
  <a href={route("/settings")} class={match("/settings", $page.url.pathname) ? "active" : ""}>
    API Keys and Models
  </a>
  <a href={route("/settings")} class={match("/settings", $page.url.pathname) ? "active" : ""}>
    Title Generation
  </a>
</nav>

<style lang="postcss">
  .active {
    @apply font-semibold text-primary;
  }
</style>
