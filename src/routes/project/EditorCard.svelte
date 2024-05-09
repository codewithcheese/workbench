<script lang="ts">
  import { Card, CardContent } from "@/components/ui/card";
  import CodeMirror from "svelte-codemirror-editor";
  import { db, type Project, submitPrompt } from "@/store.svelte";
  import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
  import { languages } from "@codemirror/language-data";
  import { type DecorationSet, EditorView, keymap, ViewPlugin, ViewUpdate } from "@codemirror/view";
  import { EditorState, Prec, RangeSetBuilder } from "@codemirror/state";
  import { autocompletion } from "@codemirror/autocomplete";
  import type { CompletionSource } from "@codemirror/autocomplete";
  import { Decoration } from "@codemirror/view";
  import { goto } from "$app/navigation";

  const documentHighlighter = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view.state);
      }

      update(update: ViewUpdate) {
        if (update.docChanged) {
          this.decorations = this.buildDecorations(update.state);
        }
      }

      buildDecorations(state: EditorState): DecorationSet {
        let builder = new RangeSetBuilder<Decoration>();
        const re = /\[\[[\w\s]+]]/g;
        let match;
        const docStr = state.doc.toString();
        while ((match = re.exec(docStr)) !== null) {
          builder.add(
            match.index,
            match.index + match[0].length,
            Decoration.mark({
              attributes: { class: "document-link" },
            }),
          );
        }
        return builder.finish();
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

  type Props = {
    project: Project;
  };
  let { project }: Props = $props();

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
    EditorView.domEventHandlers({
      click: (event, view) => {
        const { target } = event;
        if (target instanceof HTMLElement && target.className === "document-link") {
          const pos = view.posAtDOM(target);
          const { from, to } = view.state.doc.lineAt(pos);
          const lineText = view.state.doc.sliceString(from + 2, to - 2);
          const document = db.documents.items.find((d) => d.name === lineText);
          if (document) {
            goto(`/document/${document.id}`);
          }
        }
        return false;
      },
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
  :global(.document-link) {
    @apply text-purple-700 underline;
    cursor: pointer;
  }
</style>
