<script lang="ts">
  import * as Sheet from "@/components/ui/sheet";
  import { Button } from "@/components/ui/button";
  import { MenuIcon } from "lucide-svelte";
  import Menu from "./Menu.svelte";
  import type { Chat } from "@/database";

  let { chats }: { chats: Chat[] } = $props();
</script>

<Sheet.Root>
  <Sheet.Trigger asChild let:builder>
    <Button variant="outline" size="icon" class="shrink-0 md:hidden" builders={[builder]}>
      <MenuIcon class="h-5 w-5" />
      <span class="sr-only">Toggle navigation menu</span>
    </Button>
  </Sheet.Trigger>
  <Sheet.Content side="left" class="flex flex-col">
    <Menu {chats} />
  </Sheet.Content>
</Sheet.Root>
