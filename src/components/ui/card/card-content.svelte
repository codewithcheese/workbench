<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cn } from "@/lib/utils.js";
  import type { Action } from "svelte/action";

  type $$Props = HTMLAttributes<HTMLDivElement> & { action: Action<HTMLDivElement> };

  let className: $$Props["class"] = undefined;
  let action: Action<HTMLDivElement> = () => {};
  export { className as class, action };
</script>

<div use:action class={cn("p-6 pt-0", className)} {...$$restProps}>
  <slot />
</div>
