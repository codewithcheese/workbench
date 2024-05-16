<script lang="ts">
  import * as schema from "@/database/schema";
  import { Cache } from "@/database/cache";
  const cache = new Cache(schema);

  let { name } = $props();
</script>

Hello {name}!
