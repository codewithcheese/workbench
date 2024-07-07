<script lang="ts">
  import { useChat } from "$lib/ai/use-chat.svelte";

  let chat = useChat({
    api: "http://localhost:3000/api/chat",
  });

  // $inspect(chat);

  function onSubmit(event: Event) {
    event.preventDefault();
    chat.handleSubmit();
  }
</script>

<div>
  {#if chat.isLoading}
    <p>Loading...</p>
  {:else if chat.error}
    <p>Error: {chat.error.message}</p>
  {:else}
    <ul>
      {#each chat.messages as message}
        <li>{message.role}: {message.content}</li>
      {/each}
    </ul>
  {/if}
</div>

<form onsubmit={onSubmit}>
  <input bind:value={chat.input} placeholder="Type a message..." />
  <button type="submit">Send Message</button>
</form>
