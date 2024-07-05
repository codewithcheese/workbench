<script lang="ts">
  import { useChat } from "$lib/use-chat.svelte";
  import { toast } from "svelte-french-toast";
  import { removeResponse, updateMessages } from "./revise/$data";
  import { Card, CardContent, CardHeader } from "@/components/ui/card";
  import { Input } from "@/components/ui/input";
  import MessageInput from "./MessageInput.svelte";
  import { Button } from "@/components/ui/button";
  import { LoaderCircleIcon, RefreshCwIcon, XIcon } from "lucide-svelte";
  import { Badge } from "@/components/ui/badge";
  import { Label } from "@/components/ui/label";
  import MessageMarkdown from "./revise/MessageMarkdown.svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

  let { data } = $props();
  let service = $derived(data.response.model?.service);
  let response = $derived(data.response);

  $inspect("chat page", data);

  let body = $state({
    providerId: service?.providerId,
    modelName: response.model?.name,
    baseURL: service?.baseURL,
    apiKey: service?.apiKey,
  });

  $inspect("chat page", data, body);

  $effect(() => {
    Object.assign(body, {
      providerId: service?.providerId,
      modelName: response.model?.name,
      baseURL: service?.baseURL,
      apiKey: service?.apiKey,
    });
  });

  let chat = useChat({
    initialMessages: response.messages,
    body,
    onError: (e) => {
      console.log("onError", e);
      toast.error(e.message);
    },
    onFinish: (message) => {
      console.log("onFinish", chat.messages, message);
      // updateMessages(response.id, $state.snapshot(chat.messages));
    },
  });

  function handleSubmit(value: string) {
    chat.input = value;
    chat.handleSubmit();
  }
</script>

<div class="flex h-full flex-col">
  {#if !service}
    <div class="mx-auto w-full max-w-3xl">
      <Alert>
        <AlertTitle>No model</AlertTitle>
        <AlertDescription>
          <a class="underline" href={`/chat/${$page.params.id}/config`}>
            Configure your AI accounts
          </a>
          to start a chatting.
        </AlertDescription>
      </Alert>
    </div>
  {/if}
  {#each chat.messages as message (message.id)}
    {@const format = "markdown"}
    {@const content = message.content}
    <Card>
      <CardContent class="p-6">
        {#if response.error}
          <Label class="text-red-500">{response.error}</Label>
        {/if}

        {#if format === "markdown"}
          <MessageMarkdown {content} />
        {:else}
          {content}
        {/if}
      </CardContent>
    </Card>
  {/each}
  <div class="flex-1"></div>
  <MessageInput onSubmit={handleSubmit} />
</div>
