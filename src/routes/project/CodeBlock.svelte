<script lang="ts">
  import ClipboardButton from "@/components/ClipboardButton.svelte";

  type Props = {
    code: string;
    lang: string;
  };
  let { code, lang }: Props = $props();
</script>

<div class="group relative my-1 rounded-lg">
  <!-- eslint-disable svelte/no-at-html-tags -->
  <pre
    class="scrollbar-custom scrollbar-thumb-gray-500 hover:scrollbar-thumb-gray-400 dark:scrollbar-thumb-white/10 dark:hover:scrollbar-thumb-white/20 overflow-auto text-sm"><code
      class="language-{lang}">{code}</code
    ></pre>
  <ClipboardButton
    class="invisible absolute right-2 top-2 opacity-0 group-hover:visible group-hover:opacity-100"
    value={code}
  />
</div>
