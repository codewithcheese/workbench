<script lang="ts">
  import { cn } from "$lib/utils.js";
  import { DialogClose } from "@/components/ui/dialog/index";
  import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table/index";
  import { Toggle } from "@/components/ui/toggle/index";
  import { ArrowLeftIcon, EyeIcon, RefreshCwIcon, SettingsIcon, TrashIcon } from "lucide-svelte";
  import { Button } from "@/components/ui/button/index";
  import { Separator } from "@/components/ui/separator/index";
  import { Label } from "@/components/ui/label/index";
  import { Input } from "@/components/ui/input/index";
  import { db, type Model, type Service } from "@/store.svelte";
  import { type Provider, Providers, providersById } from "@/providers";
  import * as Select from "@/components/ui/select";

  type Props = {
    service: Service;
    onBack: () => void;
    onDelete: (service: Service) => void;
  };
  let { service, onBack, onDelete }: Props = $props();
  let models: Model[] = $derived(
    db.models.filter((m) => m.serviceId === service.id).sort((a, b) => a.id.localeCompare(b.id)),
  );
  let error: string | null = $state(null);
  let loading: boolean = $state(false);
  let showOptions: boolean = $state(false);
  let provider: Provider = $derived(providersById[service.providerId]);

  async function fetchModels() {
    if (!service) {
      return;
    }
    error = null;
    try {
      loading = true;
      const resp = await fetch("/api/models", {
        method: "POST",
        headers: {
          X_API_KEY: service.apiKey,
          ContentType: "application/json",
        },
        body: JSON.stringify({
          providerId: service.providerId,
          baseURL: service.baseURL,
        }),
      });
      if (!resp.ok) {
        error = resp.statusText;
        return;
      }
      const models = (await resp.json()) as any[];

      // remove models that don't exist in the response
      for (const model of db.models.items) {
        if (model.serviceId === service.id) {
          const retained = models.find((m) => m.id === model.id);
          if (!retained) {
            // update model with retained values
            db.models.remove(model.id);
          }
        }
      }

      // add or update models that exist in the response
      for (const model of models) {
        const existing = db.models.get(model.id);
        if (!existing) {
          db.models.push({ ...model, serviceId: service.id });
        } else {
          db.models.update(model.id, model);
        }
      }
    } finally {
      loading = false;
    }
  }
</script>

<div class="grid gap-4 py-4">
  <div class="flex flex-col gap-2">
    <div class="flex flex-row items-center justify-between">
      <Button size="sm" variant="outline" onclick={() => onBack()}>
        <ArrowLeftIcon class="mr-2 h-4 w-4" />
        Back
      </Button>

      <Button size="sm" variant="ghost" onclick={() => onDelete(service)}>
        <TrashIcon class="mr-2 h-4 w-4" />
        Delete
      </Button>
    </div>
  </div>
  {#if service}
    <div class="grid gap-2">
      <Label for="name">Provider</Label>
      <Select.Root
        selected={{ value: service.providerId, label: provider.name }}
        onSelectedChange={(selected) => {
          if (selected) {
            service.providerId = selected.value;
          }
        }}
      >
        <Select.Trigger>
          <Select.Value placeholder="Select a provider" />
        </Select.Trigger>
        <Select.Content>
          {#each Providers as provider (provider.id)}
            <Select.Item value={provider.id}>{provider.name}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
    </div>
    <div class="grid gap-2">
      <Label for="name">Key name</Label>
      <Input bind:value={service.name} id="name" placeholder="Enter key name" type="text" />
    </div>
    <div class="grid gap-2">
      <Label for="apiKey">API Key</Label>
      <Input
        bind:value={service.apiKey}
        id="apiKey"
        placeholder="Enter your API key"
        type="password"
      />
    </div>
    {#if showOptions}
      <div class="flex flex-row items-center justify-end gap-1 p-0 text-sm">
        <Button class="py-0" variant="link" onclick={() => (showOptions = false)}>
          <SettingsIcon size={14} /> Hide advanced options
        </Button>
      </div>
      <div class="grid gap-2">
        <Label for="baseURL">Base URL</Label>
        <Input
          bind:value={service.baseURL}
          id="baseURL"
          placeholder="Enter API base URL"
          type="text"
        />
      </div>
    {:else}
      <div class="m-0 flex flex-row items-center justify-end gap-1 text-sm">
        <Button variant="link" onclick={() => (showOptions = true)}>
          <SettingsIcon size={14} /> Advanced options
        </Button>
      </div>
    {/if}

    <Button variant="outline" onclick={() => fetchModels()}>
      <RefreshCwIcon class={cn("mr-2 h-4 w-4", loading && "loading-icon")} />
      {#if service && models.length > 0}
        Refresh Models
      {:else}
        Load Models
      {/if}
    </Button>
  {/if}
  {#if error}<Label class="text-red-500">{error}</Label>{/if}
  {#if service && models.length > 0}
    <Separator />
    <div class="grid gap-2">
      <div class="flex items-center justify-between">
        <Label>Models</Label>
        <div class="flex justify-end">
          <Button
            class="p-1 text-sm"
            variant="ghost"
            onclick={() => {
              models.forEach((m) => (m.visible = true));
            }}
          >
            Show All
          </Button>
          <Button
            class="p-1 text-sm"
            variant="ghost"
            onclick={() => {
              models.forEach((m) => (m.visible = false));
            }}
          >
            Hide All
          </Button>
        </div>
      </div>

      <div class="max-h-[calc(100vh-700px)] min-h-[200px] w-full overflow-y-auto rounded-lg border">
        <Table>
          <TableBody>
            {#each models as model (model.id)}
              <TableRow
                class={cn("cursor-pointer", model.visible ? "" : "opacity-50")}
                onclick={() => (model.visible = !model.visible)}
              >
                <TableCell class="p-1 pl-4 font-normal">{model.id}</TableCell>
                <TableCell class="p-1">
                  <Toggle aria-label="Toggle Model Visibility" />
                </TableCell>
                <TableCell class="p-1">
                  <EyeIcon class="h-4 w-4" />
                </TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      </div>
    </div>
    <DialogClose>
      <Button variant="default">Save</Button>
    </DialogClose>
  {/if}
</div>
