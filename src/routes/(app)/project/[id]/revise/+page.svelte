<script lang="ts">
  import EditorCard from "./EditorCard.svelte";
  import { Input } from "@/components/ui/input";
  import { updateChat } from "../$data";
  import ResponseCard from "./ResponseCard.svelte";
  import { untrack } from "svelte";
  import { page } from "$app/stores";

  let { data } = $props();

  // problem: cannot use chat.prompt directly since codemirror resets cursor position when prompt signal changes
  // solution: consistent prompt signal for codemirror.
  let prompt = $state(data.chat.prompt);
  let id = $derived($page.params.id);

  $effect(() => {
    // update prompt from data when route changes
    id;
    untrack(() => {
      console.log("updating prompt", $page.params.id);
      prompt = data.chat.prompt;
    });
  });

  // const update = _.debounce(updateChat, 100);

  function onChange() {
    updateChat({ ...data.chat, prompt });
  }
</script>

<div class="space-y-2 overflow-y-auto pl-1 pr-2 pt-1">
  <Input
    class="p-2 text-lg"
    bind:value={data.chat.name}
    oninput={() => {
      console.log("onChange", data.chat.name);
      onChange();
    }}
  />
  <EditorCard bind:prompt chat={data.chat} {onChange} />
</div>
<div class="flex flex-col gap-3 pt-1">
  {#each data.responses.toReversed() as response (response.id)}
    {@const service = response.model?.service}
    <ResponseCard {response} {service} initialMessages={response.messages} />
  {/each}
</div>
<!--{:else}-->
<!--  <Splash>-->
<!--    <p>Configure your AI accounts to start building.</p>-->
<!--    <Button onclick={() => document.getElementById("model-config-trigger")?.click()}>Start</Button>-->
<!--  </Splash>-->
<!--{/if}-->
