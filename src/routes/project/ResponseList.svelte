<script lang="ts">
  import ResponseCard from "./ResponseCard.svelte";
  import type { ProjectView } from "./[id]/+page";

  type Props = {
    responses: ProjectView["responses"];
  };
  let { responses }: Props = $props();
</script>

{#each responses.toReversed() as response (response.id)}
  {@const model = response.model}
  {@const service = model.service}
  <ResponseCard {response} {service} />
{/each}
