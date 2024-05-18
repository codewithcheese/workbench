<script lang="ts">
  import Header from "./Header.svelte";
  import EditorCard from "./EditorCard.svelte";
  import { Input } from "@/components/ui/input";
  import { updateProject } from "./$data";
  import _ from "lodash";

  let { data } = $props();

  // problem: cannot use project.prompt directly since codemirror resets cursor position when prompt signal changes
  // solution: consistent prompt signal for codemirror.
  let prompt = $state(data.project.prompt);

  // update prompt when project changes, cannot bind to derived state
  $effect(() => {
    prompt = data.project.prompt;
  });

  // const update = _.debounce(updateProject, 100);

  function onChange() {
    updateProject({ ...data.project, prompt });
  }
</script>

<Header project={data.project} services={data.services} />
<!--{#if db.services.length > 0}-->
<div class="px-4 pt-4"></div>
<div class="grid grid-cols-2 gap-3 overflow-y-auto px-4">
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
  <div class="mr-1 space-y-2 overflow-y-auto pr-2 pt-1">
    <slot />
  </div>
</div>
<!--{:else}-->
<!--  <Splash>-->
<!--    <p>Configure your AI accounts to start building.</p>-->
<!--    <Button onclick={() => document.getElementById("model-config-trigger")?.click()}>Start</Button>-->
<!--  </Splash>-->
<!--{/if}-->
