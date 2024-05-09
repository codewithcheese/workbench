<script lang="ts">
  let { children } = $props();
</script>

<div class="flex min-h-screen items-center justify-center">
  <div class="flex flex-col items-center space-y-4">{@render children()}</div>
</div>
