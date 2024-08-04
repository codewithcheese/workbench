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
  import SuperDebug, { setError, superForm } from "sveltekit-superforms";
  import { zodClient } from "sveltekit-superforms/adapters";
  import { formSchema } from "../$data";
  import {
    FormButton,
    FormControl,
    FormField,
    FormFieldErrors,
    FormLabel,
  } from "@/components/ui/form";
  import { z } from "zod";
  import { aiAccountTable, aiModelTable, aiServiceTable, useDb } from "@/database";
  import { eq } from "drizzle-orm";
  import { nanoid } from "nanoid";
  import { goto } from "$app/navigation";
  import { route } from "$lib/route";
  import { LoaderCircle, TriangleAlertIcon } from "lucide-svelte";
  import { cn } from "$lib/cn";
  import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

  export async function fetchModels(form: z.infer<typeof formSchema>) {}

  let { data } = $props();
  const formHandle = superForm(data.form, {
    SPA: true,
    validators: zodClient(formSchema),
    onUpdate: async ({ form }) => {
      if (!form.valid) {
        return;
      }
      try {
        // query provider
        const provider = await useDb().query.aiServiceTable.findFirst({
          where: eq(aiServiceTable.id, form.data.aiServiceId),
        });
        if (!provider) {
          setError(form, "aiServiceId", `Provider for ${form.data.aiServiceId} not found`);
          return;
        }
        // fetch models
        const resp = await fetch("/api/models", {
          method: "POST",
          headers: {
            Authorization: form.data.apiKey,
            ContentType: "application/json",
          },
          body: JSON.stringify({
            providerId: provider.id,
            baseURL: form.data.baseURL,
          }),
        });
        if (!resp.ok) {
          // if failed to fetch models, ask user to update API key
          setError(form, "apiKey", resp.statusText);
          return;
        }
        // create account and update models
        const accountId = nanoid(10);
        await useDb().transaction(async (tx) => {
          await tx.insert(aiAccountTable).values({
            id: accountId,
            name: form.data.name,
            aiServiceId: form.data.aiServiceId,
            baseURL: form.data.baseURL,
            apiKey: form.data.apiKey,
          });
          const models = (await resp.json()) as any[];
          await tx
            .insert(aiModelTable)
            .values(
              models.map((m) => ({ ...m, id: nanoid(10), visible: 1, aiAccountId: accountId })),
            );
        });
        await goto(route(`/settings/ai-accounts/[id]`, { id: accountId }));
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
          <CardTitle>Add AI account</CardTitle>
          <CardDescription>
            Select an AI service, enter your account name and API key.
          </CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div class="flex max-w-xl flex-col gap-4">
        <FormField form={formHandle} name="aiServiceId">
          <FormControl let:attrs>
            <FormLabel>AI Service</FormLabel>
            <Select
              {...attrs}
              onSelectedChange={(selected) => {
                if (selected) {
                  // @ts-expect-error not inferring selected.value as string
                  $form.aiServiceId = selected.value;
                }
              }}
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
          </FormControl>
          <FormFieldErrors />
        </FormField>
        <FormField form={formHandle} name="name">
          <FormControl let:attrs>
            <FormLabel>Account name</FormLabel>
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
