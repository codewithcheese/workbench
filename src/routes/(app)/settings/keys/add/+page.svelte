<script lang="ts">
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  import { Input } from "@/components/ui/input/index.js";
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
  import { setError, superForm } from "sveltekit-superforms";
  import { zodClient } from "sveltekit-superforms/adapters";
  import { fetchModels, formSchema, refreshModels } from "../$data";
  import {
    FormButton,
    FormControl,
    FormField,
    FormFieldErrors,
    FormLabel,
  } from "@/components/ui/form";
  import { keyTable, modelTable, serviceTable, useDb } from "@/database";
  import { eq } from "drizzle-orm";
  import { nanoid } from "nanoid";
  import { goto } from "$app/navigation";
  import { route } from "$lib/route";
  import { LoaderCircle, TriangleAlertIcon } from "lucide-svelte";
  import { cn } from "$lib/cn";
  import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
  import { toast } from "svelte-french-toast";

  let { data } = $props();

  console.log("data", data);

  const formHandle = superForm(data.form, {
    SPA: true,
    validators: zodClient(formSchema),
    onUpdate: async ({ form }) => {
      if (!form.valid) {
        return;
      }
      try {
        // query service
        const service = await useDb().query.serviceTable.findFirst({
          where: eq(serviceTable.id, form.data.serviceId),
          with: { sdk: true },
        });
        if (!service) {
          setError(form, "serviceId", `Service for ${form.data.serviceId} not found`);
          return;
        }
        // fetch models
        const resp = await fetchModels(
          form.data.apiKey,
          form.data.baseURL,
          service.sdk.id,
          service.id,
        );
        if (!resp.ok) {
          // if failed to fetch models, ask user to update API key
          setError(form, "apiKey", resp.statusText);
          return;
        }
        // create account and update models
        const keyId = nanoid(10);
        await useDb().transaction(async (tx) => {
          await tx.insert(keyTable).values({
            id: keyId,
            name: form.data.name,
            serviceId: form.data.serviceId,
            baseURL: form.data.baseURL,
            apiKey: form.data.apiKey,
          });
          const models = (await resp.json()) as any[];
          await refreshModels(tx, keyId, models);
        });
        toast.success("Key added");
        await goto(route(`/settings/keys/[id]`, { id: keyId }));
      } catch (e) {
        setError(form, "", e instanceof Error ? e.message : "Unknown error");
      }
    },
  });

  const { form, enhance, submitting, allErrors } = formHandle;
</script>

<form use:enhance method="post">
  <Card>
    <CardHeader>
      <div class="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Add API key</CardTitle>
          <CardDescription>Select a service and enter your API key.</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div class="flex max-w-xl flex-col gap-4">
        <FormField form={formHandle} name="serviceId">
          <FormControl let:attrs>
            <FormLabel>Service</FormLabel>
            <Select
              {...attrs}
              onSelectedChange={(selected) => {
                if (selected) {
                  // @ts-expect-error not inferring selected.value as string
                  $form.serviceId = selected.value;
                  $form.baseURL =
                    data.services.find((s) => s.id === selected.value)?.baseURL ?? null;
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a service..." />
              </SelectTrigger>
              <SelectContent>
                {#each data.services as service (service.id)}
                  {#if service.sdk.supported}
                    <SelectItem image="/icons/{service.id}-16x16.png" value={service.id}>
                      {service.name}
                    </SelectItem>
                  {/if}
                {/each}
              </SelectContent>
            </Select>
          </FormControl>
          <FormFieldErrors />
        </FormField>
        <FormField form={formHandle} name="name">
          <FormControl let:attrs>
            <FormLabel>Key name</FormLabel>
            <Input {...attrs} bind:value={$form.name} />
          </FormControl>
          <FormFieldErrors />
        </FormField>
        <FormField form={formHandle} name="apiKey">
          <FormControl let:attrs>
            <FormLabel>API Key</FormLabel>
            <Input type="password" {...attrs} bind:value={$form.apiKey} />
          </FormControl>
          <FormFieldErrors />
        </FormField>
        <FormField form={formHandle} name="baseURL">
          <FormControl let:attrs>
            <FormLabel>Base URL</FormLabel>
            <Input
              placeholder="Leave blank to use default"
              type="text"
              {...attrs}
              bind:value={$form.baseURL}
            />
          </FormControl>
          <FormFieldErrors />
        </FormField>

        {#each $allErrors as error}
          {#if error.path === "_errors"}
            {#each error.messages as message}
              <Alert variant="destructive">
                <TriangleAlertIcon class="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            {/each}
          {/if}
        {/each}
      </div>
    </CardContent>
    <CardFooter>
      <FormButton disabled={$submitting}>
        <LoaderCircle class={cn("mr-2 h-4 w-4 animate-spin", !$submitting && "hidden")} />
        {$submitting ? "Saving..." : "Save"}
      </FormButton>
    </CardFooter>
  </Card>
</form>
