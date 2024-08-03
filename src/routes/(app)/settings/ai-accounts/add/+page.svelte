<script lang="ts">
  import { Button } from "@/components/ui/button/index.js";
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  import { Input } from "@/components/ui/input/index.js";
  import { PlusCircleIcon, RefreshCwIcon, SettingsIcon } from "lucide-svelte";
  import { Providers, providersById } from "$lib/providers";
  import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
  import { goto } from "$app/navigation";
  import { route } from "$lib/route";
  import { cn } from "$lib/utils";
  import { Label } from "@/components/ui/label";
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
  import type { Selected } from "bits-ui";
  import { toast } from "svelte-french-toast";

  let { data } = $props();
  let selectedService = $state<Selected<string> | undefined>(undefined);
  let name = $state("");
  let apiKey = $state("");
  let baseURL = $state("");
  let showOptions = $state(false);

  async function handleSave() {
    if (!selectedService) {
      toast.error("Please select an AI service");
      return false;
    }
  }

  // todo: use svelte forms
</script>

<Card>
  <CardHeader>
    <div class="flex flex-row items-center justify-between">
      <div>
        <CardTitle>Add AI account</CardTitle>
        <CardDescription>Select an AI service, enter your account name and API key.</CardDescription
        >
      </div>
    </div>
  </CardHeader>

  <CardContent>
    <div class="flex max-w-xl flex-col gap-4">
      <div class="grid gap-2">
        <Label for="name">Service provider</Label>
        <Select
          selected={selectedService}
          onSelectedChange={(selected) => (selectedService = selected)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an AI service" />
          </SelectTrigger>
          <SelectContent>
            {#each data.aiServices as service (service.id)}
              <SelectItem value={service.id}>{service.name}</SelectItem>
            {/each}
          </SelectContent>
        </Select>
      </div>
      <div class="grid gap-2">
        <Label for="name">Account name</Label>
        <Input bind:value={name} id="name" placeholder="Enter account name" type="text" />
      </div>
      <div class="grid gap-2">
        <Label for="apiKey">API Key</Label>
        <Input bind:value={apiKey} id="apiKey" placeholder="Enter your API key" type="password" />
      </div>

      <!--      <Button variant="outline" onclick={() => fetchModels()}>-->
      <!--        <RefreshCwIcon class={cn("mr-2 h-4 w-4", modelsLoading && "loading-icon")} />-->
      <!--        {#if service.models.length > 0}-->
      <!--          Refresh Models-->
      <!--        {:else}-->
      <!--          Load Models-->
      <!--        {/if}-->
      <!--      </Button>-->
    </div>
  </CardContent>
  <CardFooter>
    <Button variant="default" onclick={handleSave}>Save</Button>
  </CardFooter>
</Card>
