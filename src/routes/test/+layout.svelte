<script lang="ts">
  let { data } = $props();
</script>

<div>{data.project.name}</div>
<slot></slot>
