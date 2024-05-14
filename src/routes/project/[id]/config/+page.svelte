<script lang="ts">
  import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
  import CreateAccount from "./CreateAccount.svelte";
  import SelectAccount from "./SelectAccount.svelte";
  import UpdateAccount from "./UpdateAccount.svelte";
  import { DialogHeader } from "@/components/ui/dialog/index.js";
  import { goto, onNavigate } from "$app/navigation";
  import { page } from "$app/stores";
  import type { PageData } from "./$types";
  import { toast } from "svelte-french-toast";
  import type { ServiceView } from "@/routes/project/[id]/config/$model.svelte";

  let { data }: { data: PageData } = $props();
  let model = $derived(data.model);
  $inspect(model);

  const open = true;

  type Route = { name: "create" } | { name: "select" } | { name: "update"; view: ServiceView };

  let route: Route = $state({ name: "select" });
</script>

<Dialog
  {open}
  onOpenChange={(isOpen) => {
    if (!isOpen) {
      goto(`/project/${$page.params.id}`);
    }
  }}
>
  <DialogTrigger id="model-config-trigger"></DialogTrigger>
  <DialogContent class="max-h-screen overflow-y-auto sm:max-w-[425px]">
    <DialogHeader>
      {#if route.name === "create"}
        <DialogTitle>Select AI provider</DialogTitle>
      {:else if route.name === "select"}
        <DialogTitle>Your AI accounts</DialogTitle>
      {:else if route.name === "update"}
        <DialogTitle>Update AI account</DialogTitle>
      {/if}
    </DialogHeader>
    {#if route.name === "create"}
      <CreateAccount
        onSelect={async (provider) => {
          try {
            const view = await model.addService(provider);
            route = { name: "update", view };
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Unknown error");
          }
        }}
      />
    {:else if route.name === "select"}
      <SelectAccount
        {model}
        onAdd={() => (route = { name: "create" })}
        onSelect={(view) => (route = { name: "update", view })}
      />
    {:else if route.name === "update"}
      <UpdateAccount
        {model}
        view={route.view}
        onBack={() => (route = { name: "select" })}
        onDelete={(id) => {
          model.deleteService(id);
          route = { name: "select" };
        }}
      />
    {/if}
  </DialogContent>
</Dialog>
