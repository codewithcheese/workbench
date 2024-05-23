<script lang="ts">
  import * as Sheet from "@/components/ui/sheet";
  import { Button } from "@/components/ui/button";
  import { MenuIcon } from "lucide-svelte";
  import Menu from "./Menu.svelte";
  import type { Project } from "@/database";

  let { projects }: { projects: Project[] } = $props();
</script>

<Sheet.Root>
  <Sheet.Trigger asChild let:builder>
    <Button variant="outline" size="icon" class="shrink-0 md:hidden" builders={[builder]}>
      <MenuIcon class="h-5 w-5" />
      <span class="sr-only">Toggle navigation menu</span>
    </Button>
  </Sheet.Trigger>
  <Sheet.Content side="left" class="flex flex-col">
    <Menu {projects} />
  </Sheet.Content>
</Sheet.Root>
