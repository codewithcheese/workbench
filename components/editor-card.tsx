import { Card, CardContent } from "@/components/ui/card";
import CodeMirror, { EditorView, keymap, Prec } from "@uiw/react-codemirror";
import { useCallback, useMemo } from "react";
import { store, submitPrompt } from "@/app/store";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { useSnapshot } from "valtio";

export function EditorCard() {
  const prompt = useSnapshot(store.prompt);

  const onChange = useCallback(
    (value: string) => (store.prompt.blocks[0] = value),
    [store]
  );

  const extensions = useMemo(() => {
    return [
      Prec.highest(
        keymap.of([
          {
            key: "Ctrl-Enter",
            run: () => {
              submitPrompt();
              return true;
            },
          },
        ])
      ),
      EditorView.lineWrapping,
      markdown({
        base: markdownLanguage,
        codeLanguages: languages,
      }),
    ];
  }, [submitPrompt]);

  return (
    <Card className="overflow-y-auto">
      <CardContent className="p-0  prose">
        <CodeMirror
          value={prompt.blocks[0]}
          onChange={onChange}
          extensions={extensions}
        />
      </CardContent>
    </Card>
  );
}
