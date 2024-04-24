import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Select } from "@radix-ui/react-select";
import {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { store } from "@/app/store";
import { useSnapshot } from "valtio";

type HeaderProps = { onSubmit: () => void };

export function Header({ onSubmit }: HeaderProps) {
  const { model } = useSnapshot(store);
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
        <Select value={model} onValueChange={(value) => (store.model = value)}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Models</SelectLabel>
              <SelectItem value="claude-3-opus-20240229">
                claude-3-opus-20240229
              </SelectItem>
              <SelectItem value="claude-3-sonnet-20240229">
                claude-3-sonnet-20240229
              </SelectItem>
              <SelectItem value="claude-3-haiku-20240307">
                claude-3-haiku-20240307
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <Button onClick={onSubmit}>Run</Button>
    </header>
  );
}
