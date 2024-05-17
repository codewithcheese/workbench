<script lang="ts">
  let { data } = $props();

  import { goto } from "$app/navigation";

  if (data.projects.length) {
    const project = data.projects[data.projects.length - 1];
    goto(`/project/${project.id}`);
  }
</script>
