<script lang="ts">
  import { db, type Project } from "@/store.svelte";
  import ResponseCard from "@/routes/project/ResponseCard.svelte";

  type Props = {
    project: Project;
  };
  const { project }: Props = $props();
</script>

{#each db.responses
  .filter((r) => r.projectId === project.id)
  .toReversed() as response (response.id)}
  {@const model = db.models.get(response.modelId)}
  {@const service = db.services.get(model.serviceId)}
  <ResponseCard {response} {service} />
{/each}
