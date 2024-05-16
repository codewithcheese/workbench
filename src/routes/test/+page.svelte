<script lang="ts">
  import { Input } from "@/components/ui/input";
  import { Button } from "@/components/ui/button";
  import { getCache, useCache } from "@/database/cache.svelte";

  let { data } = $props();
  let project = $derived(data.project);

  console.log("data", data);

  function viewCache() {
    console.log("viewCache", getCache());
  }

  $inspect(data.message);
  $inspect(data.greeting);
  $inspect(data.project.name);
  $inspect(data.project.responses[0].modelId);

  console.log("data", data.greeting, data.project, data.project.name);
</script>

<Input bind:value={data.message} />
<Input bind:value={data.project.name} />
<Button onclick={() => viewCache()}>View Cache</Button>

{JSON.stringify(data.project)}

{#each data.project.responses as response}
  <div><Input bind:value={response.modelId} /></div>
{/each}
