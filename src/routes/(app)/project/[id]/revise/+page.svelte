<script lang="ts">
  import EditorCard from "./EditorCard.svelte";
  import { Input } from "@/components/ui/input";
  import { updateProject } from "../$data";
  import ResponseCard from "./ResponseCard.svelte";
  import { untrack } from "svelte";
  import { page } from "$app/stores";

  let { data } = $props();

  // problem: cannot use project.prompt directly since codemirror resets cursor position when prompt signal changes
  // solution: consistent prompt signal for codemirror.
  let prompt = $state(data.project.prompt);

  $effect(() => {
    // update prompt from data when route changes
    $page.params.id;
    untrack(() => {
      prompt = data.project.prompt;
    });
  });

  // const update = _.debounce(updateProject, 100);

  function onChange() {
    updateProject({ ...data.project, prompt });
  }
</script>

<div class="space-y-2 overflow-y-auto pl-1 pr-2 pt-1">
  <Input
    class="p-2 text-lg"
    bind:value={data.project.name}
    oninput={() => {
      console.log("onChange", data.project.name);
      onChange();
    }}
  />
  <EditorCard bind:prompt project={data.project} {onChange} />
</div>
{#each data.responses.toReversed() as response (response.id)}
  {@const model = response.model}
  {@const service = model.service}
  <ResponseCard {response} {service} initialMessages={response.messages} />
{/each}

<!--{:else}-->
<!--  <Splash>-->
<!--    <p>Configure your AI accounts to start building.</p>-->
<!--    <Button onclick={() => document.getElementById("model-config-trigger")?.click()}>Start</Button>-->
<!--  </Splash>-->
<!--{/if}-->
