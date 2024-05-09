<script lang="ts">
  import { Card, CardContent } from "@/components/ui/card";
  import CodeMirror from "svelte-codemirror-editor";
  import { db, type Project, submitPrompt } from "@/store.svelte";
  import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
  import { languages } from "@codemirror/language-data";
  import {
    type DecorationSet,
    EditorView,
    keymap,
    ViewPlugin,
    ViewUpdate,
    WidgetType,
  } from "@codemirror/view";
  import { EditorState, Prec, RangeSetBuilder } from "@codemirror/state";
  import { autocompletion } from "@codemirror/autocomplete";
  import type { CompletionSource } from "@codemirror/autocomplete";
  import { Decoration } from "@codemirror/view";
  import { goto } from "$app/navigation";
  import { toast } from "svelte-french-toast";

  type Props = {
    project: Project;
  };
  let { project }: Props = $props();

  class DocumentLink extends WidgetType {
    toDOM() {
      const span = document.createElement("span");
      span.className = "document-link-icon";
      span.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-symlink"><path d="m10 18 3-3-3-3"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M4 11V4a2 2 0 0 1 2-2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h7"/></svg>';
      return span;
    }
  }

  const documentHighlighter = ViewPlugin.fromClass(
    class {
      view: EditorView;
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.view = view;
        this.decorations = this.buildDecorations(view.state);
        this.handleClick = this.handleClick.bind(this);
        view.dom.addEventListener("click", this.handleClick);
      }

      destroy() {
        this.view.dom.removeEventListener("click", this.handleClick);
      }
      update(update: ViewUpdate) {
        if (update.docChanged) {
          this.decorations = this.buildDecorations(update.state);
        }
      }

      buildDecorations(state: EditorState): DecorationSet {
        let builder = new RangeSetBuilder<Decoration>();
        const re = /\[\[([\w\s]+)]]/g;
        let match: RegExpExecArray | null;
        const docStr = state.doc.toString();
        while ((match = re.exec(docStr)) !== null) {
          // check if document exists
          const exists = !!db.documents.items.find((d) => d.name === match![1]);
          builder.add(
            match.index,
            match.index + match[0].length,
            Decoration.mark({
              attributes: { class: exists ? "document-mention" : "document-missing" },
            }),
          );
          builder.add(
            match.index + match[0].length,
            match.index + match[0].length,
            Decoration.widget({
              widget: new DocumentLink(),
              side: 1, // Render after the text
              name: match[1],
              type: "document-link",
            }),
          );
        }
        return builder.finish();
      }

      handleClick(event: any) {
        const pos = this.view.posAtCoords({ x: event.clientX, y: event.clientY });
        if (pos == null) return false;
        // iterate decorations to find the document link
        let cursor = this.decorations.iter(pos);
        while ((cursor.next(), cursor.value !== null)) {
          if (cursor.value && cursor.from === pos && cursor.to === pos) {
            const deco = cursor.value;
            if (deco.spec.type !== "document-link") {
              continue;
            }
            const document = db.documents.items.find((d) => d.name === deco.spec.name);
            if (document) {
              goto(`/document/${document.id}`);
            } else {
              toast.error(`Document "${deco.spec.name}" not found`);
            }
          } else if (cursor.from > pos) {
            break;
          }
        }
      }
    },
    {
      decorations: (v) => v.decorations,
    },
  );

  const documentCompletion: CompletionSource = (context) => {
    const word = context.matchBefore(/\[\[([^\]]|](?!]))*/);
    if (word && word.from < word.to) {
      const mentions = db.documents.items.map((d) => ({ label: d.name, type: "document" }));
      return {
        from: word.from + 2,
        options: mentions.map((mention) => ({
          label: mention.label,
          apply: `${mention.label}`,
        })),
        filter: true,
      };
    }
    return null;
  };

  const extensions = [
    Prec.highest(
      keymap.of([
        {
          key: "Ctrl-Enter",
          run: () => {
            submitPrompt(project);
            return true;
          },
        },
      ]),
    ),
    EditorView.lineWrapping,
    documentHighlighter,
    autocompletion({
      activateOnTyping: true,
      override: [documentCompletion],
    }),
    markdown({
      base: markdownLanguage,
      codeLanguages: languages,
    }),
  ];
</script>

<div>
  <Card class="overflow-y-auto">
    <CardContent class="p-0">
      <CodeMirror class="w-full" bind:value={project.prompt} {extensions} />
    </CardContent>
  </Card>
</div>

<style lang="postcss">
  :global(.document-mention) {
    @apply text-purple-700 underline;
  }

  :global(.document-missing) {
    @apply text-red-700 underline;
  }

  :global(.document-link-icon svg) {
    display: inline !important;
    @apply h-4 w-4 text-gray-500;
    cursor: pointer;
  }
</style>
