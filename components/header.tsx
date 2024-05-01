import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { store, submitPrompt } from "@/app/store";
import { useSnapshot } from "valtio";
import { ModelConfig } from "@/components/model-config";
import { SelectModel } from "@/components/select-model";
import { PlayIcon } from "lucide-react";

export function Header() {
  const selected = useSnapshot(store.selected);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <nav aria-label="breadcrumb" className="hidden md:flex">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </nav>
      <div className="relative ml-auto flex-1 md:grow-0">
        <div className="flex flex-row">
          <SelectModel />
          <ModelConfig />
        </div>
      </div>
      {selected.model && (
        <Button onClick={() => submitPrompt()}>
          <PlayIcon size={16} className="mr-2" />
          Run
          <div className="w-13 h-6 px-2 py-1 ml-1 bg-white bg-opacity-20 rounded-full hidden md:inline-flex">
            <div className="text-center text-white text-xs font-light">
              Ctrl + ⏎
            </div>
          </div>
        </Button>
      )}
    </header>
  );
}
