<script lang="ts">
  import { marked, type MarkedOptions } from "marked";
  import markedKatex from "marked-katex-extension";
  import CodeBlock from "@/routes/project/CodeBlock.svelte";

  type Props = {
    message: { role: string; content: string };
  };
  let { message }: Props = $props();

  let contentEl: HTMLElement | undefined = $state();

  export const PUBLIC_SEP_TOKEN = "</s>";

  const renderer = new marked.Renderer();
  // For code blocks with simple backticks
  renderer.codespan = (code) => {
    // Unsanitize double-sanitized code
    return `<code>${code.replaceAll("&amp;", "&")}</code>`;
  };

  renderer.link = (href, title, text) => {
    return `<a href="${href?.replace(/>$/, "")}" target="_blank" rel="noreferrer">${text}</a>`;
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { extensions, ...defaults } = marked.getDefaults() as MarkedOptions & {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    extensions: any;
  };

  const options: MarkedOptions = {
    ...defaults,
    gfm: true,
    breaks: true,
    renderer,
  };

  function sanitizeMd(md: string) {
    let ret = md
      .replace(/<\|[a-z]*$/, "")
      .replace(/<\|[a-z]+\|$/, "")
      .replace(/<$/, "")
      .replaceAll(PUBLIC_SEP_TOKEN, " ")
      .replaceAll(/<\|[a-z]+\|>/g, " ")
      .replaceAll(/<br\s?\/?>/gi, "\n")
      .replaceAll("<", "&lt;")
      .trim();

    // for (const stop of [...(model.parameters?.stop ?? []), "<|endoftext|>"]) {
    //   if (ret.endsWith(stop)) {
    //     ret = ret.slice(0, -stop.length).trim();
    //   }
    // }

    return ret;
  }

  function unsanitizeMd(md: string) {
    return md.replaceAll("&lt;", "<");
  }

  let tokens = $derived(marked.lexer(sanitizeMd(message.content)));
</script>

<div
  class="prose max-w-none dark:prose-invert max-sm:prose-sm prose-headings:font-semibold prose-h1:text-lg prose-h2:text-base prose-h3:text-base prose-pre:my-1 prose-pre:bg-gray-800 prose-ol:my-1 prose-li:my-1 dark:prose-pre:bg-gray-900"
  bind:this={contentEl}
>
  {#each tokens as token, index (index)}
    {#if token.type === "code"}
      <CodeBlock lang={token.lang} code={unsanitizeMd(token.text)} />
    {:else}
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html marked.parse(token.raw, options)}
    {/if}
  {/each}
</div>
