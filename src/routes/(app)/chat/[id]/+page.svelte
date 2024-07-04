<script lang="ts">
  import { useChat } from "$lib/use-chat.svelte";
  import { toast } from "svelte-french-toast";
  import { updateMessages } from "./revise/$data";
  import { Card } from "@/components/ui/card";
  import { Input } from "@/components/ui/input";
  import MessageInput from "./MessageInput.svelte";

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
<!--  <Card>{message.content}</Card>-->
<!--{/each}-->
<div class="flex h-full flex-col">
  <div class="flex flex-1">Hello</div>
  <MessageInput />
</div>
