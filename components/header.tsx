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
import { store, submitPrompt } from "@/app/store";
import { useSnapshot } from "valtio";
import { ModelConfig } from "@/components/model-config";

export function Header() {
  const selected = useSnapshot(store.selected);
  const services = useSnapshot(store.services);

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
          <Select
            disabled={!Object.values(services).length}
            value={
              selected.service
                ? JSON.stringify({
                    serviceId: selected.service.id,
                    modelId: selected.modelId,
                  })
                : undefined
            }
            onValueChange={(value) => {
              if (value) {
                const { serviceId, modelId } = JSON.parse(value);
                store.selected.service = store.services.find(
                  (s) => s.id === serviceId
                );
                store.selected.modelId = modelId;
                console.log("Updated selected", store.selected);
              }
            }}
          >
            <SelectTrigger className="w-[240px]">
              <SelectValue
                placeholder={
                  Object.values(services).length
                    ? "Select a model"
                    : "No models configured"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {Object.values(services).map((service, index) => (
                <SelectGroup key={index}>
                  <SelectLabel>{service.name}</SelectLabel>
                  {service.models
                    .filter((m) => m.visible)
                    .map((model, index) => (
                      <SelectItem
                        key={index}
                        value={JSON.stringify({
                          serviceId: service.id,
                          modelId: model.id,
                        })}
                      >
                        {model.id}
                      </SelectItem>
                    ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
          <ModelConfig />
        </div>
      </div>
      {selected.service && <Button onClick={() => submitPrompt()}>Run</Button>}
    </header>
  );
}
