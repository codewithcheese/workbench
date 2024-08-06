<script lang="ts">
  import Nav from "./Nav.svelte";
  let { data } = $props();
</script>

<main
  class="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10"
>
  <div class="mx-auto grid w-full max-w-6xl gap-2">
    <h1 class="text-3xl font-semibold">Settings</h1>
  </div>
  <div
    class="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]"
  >
    <div class="flex flex-col gap-2">
      <Nav />
    </div>

    <div class="grid gap-6">
      <slot />
    </div>
  </div>
</main>
