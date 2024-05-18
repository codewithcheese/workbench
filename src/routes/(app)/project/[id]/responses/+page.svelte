<script lang="ts">
  import ResponseCard from "./ResponseCard.svelte";

  let { data } = $props();
  $inspect(data);
</script>

{#each data.responses.toReversed() as response (response.id)}
  {@const model = response.model}
  {@const service = model.service}
  <ResponseCard {response} {service} initialMessages={response.messages} />
{/each}
