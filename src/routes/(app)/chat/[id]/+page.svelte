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

  let { response, service, hello } = $props();

  $inspect("chat page", response, service, hello);

  // let body = $state({
  //   providerId: service?.providerId,
  //   modelName: response.model?.name,
  //   baseURL: service?.baseURL,
  //   apiKey: service?.apiKey,
  // });
  //
  // $effect(() => {
  //   Object.assign(body, {
  //     providerId: service?.providerId,
  //     modelName: response.model?.name,
  //     baseURL: service?.baseURL,
  //     apiKey: service?.apiKey,
  //   });
  // });
  //
  // let chat = useChat({
  //   initialMessages: response.messages,
  //   body,
  //   onError: (e) => {
  //     console.log("onError", e);
  //     toast.error(e.message);
  //   },
  //   onFinish: (message) => {
  //     console.log("onFinish", chat.messages, message);
  //     // updateMessages(response.id, $state.snapshot(chat.messages));
  //   },
  // });
</script>

<!--{#each chat.messages as message (message.id)}-->
<!--  {@const format = "markdown"}-->
<!--  {@const content = message.content}-->
<!--  <Card>-->
<!--    <CardHeader class="flex flex-row items-center space-x-2 space-y-0 bg-muted/50 p-2">-->
<!--      {#if chat.isLoading}-->
<!--        <Button-->
<!--          name="stop"-->
<!--          onclick={() => chat.stop()}-->
<!--          variant="ghost"-->
<!--          class="h-6 w-6 p-1 text-gray-500"-->
<!--        >-->
<!--          <LoaderCircleIcon class="loading-icon" />-->
<!--        </Button>-->
<!--      {:else}-->
<!--        <Button-->
<!--          aria-label="refresh"-->
<!--          onclick={refresh}-->
<!--          variant="ghost"-->
<!--          class="h-6 w-6 p-1 text-gray-500"-->
<!--        >-->
<!--          <RefreshCwIcon />-->
<!--        </Button>-->
<!--        &lt;!&ndash;      <RefreshCwIcon&ndash;&gt;-->
<!--        &lt;!&ndash;        onclick={refresh}&ndash;&gt;-->
<!--        &lt;!&ndash;        size={16}&ndash;&gt;-->
<!--        &lt;!&ndash;        class="cursor-pointer text-gray-500 hover:bg-accent"&ndash;&gt;-->
<!--        &lt;!&ndash;      />&ndash;&gt;-->
<!--      {/if}-->

<!--      <div class="pr-2 text-xs text-gray-500">{response.model?.name || "deleted"}</div>-->
<!--      <div class="flex-1"></div>-->
<!--      <Badge onclick={() => (format = "markdown")} variant="outline" class="hover:bg-gray-200"-->
<!--        >Markdown</Badge-->
<!--      >-->
<!--      <Badge onclick={() => (format = "text")} variant="outline" class="hover:bg-gray-200"-->
<!--        >Text</Badge-->
<!--      >-->
<!--      <XIcon-->
<!--        class="text-gray-500"-->
<!--        size={16}-->
<!--        onclick={() => {-->
<!--          stop();-->
<!--          removeResponse(response.id);-->
<!--        }}-->
<!--      />-->
<!--    </CardHeader>-->
<!--    <CardContent class="p-6">-->
<!--      {#if response.error}-->
<!--        <Label class="text-red-500">{response.error}</Label>-->
<!--      {/if}-->

<!--      {#if format === "markdown"}-->
<!--        <MessageMarkdown {content} />-->
<!--      {:else}-->
<!--        {content}-->
<!--      {/if}-->
<!--    </CardContent>-->
<!--  </Card>-->
<!--{/each}-->
<div class="flex h-full flex-col">
  <div class="flex flex-1">Hello</div>
  <MessageInput />
</div>
