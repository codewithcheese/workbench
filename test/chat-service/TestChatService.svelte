<script lang="ts">
  import { ChatService } from "$lib/chat-service.svelte.js";

  let chat = new ChatService({
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
