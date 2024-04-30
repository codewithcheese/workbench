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
      {selected.model && <Button onClick={() => submitPrompt()}>Run</Button>}
    </header>
  );
}
