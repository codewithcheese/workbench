import { Select } from "@radix-ui/react-select";
import {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  isSelectedModelAvailable,
  selectNextAvailableModel,
  store,
} from "@/app/store";
import { useSnapshot } from "valtio";
import { useEffect } from "react";

export function SelectModel() {
  const selected = useSnapshot(store.selected);
  const services = useSnapshot(store.services);

  useEffect(() => {
    console.log("services", services, "selected", selected.model);
    // if model removed or no longer visible, set to first visible model
    if (!isSelectedModelAvailable()) {
      console.log("Selecting next available model");
      selectNextAvailableModel();
    }
    // if model not set then set to first visible model
    if (!selected.model) {
      selectNextAvailableModel();
    }
  }, [services]);

  return (
    <Select
      disabled={!Object.values(services).length}
      value={
        selected.model
          ? JSON.stringify({
              serviceId: selected.model.service.id,
              modelId: selected.model.modelId,
            })
          : undefined
      }
      onValueChange={(value) => {
        if (value) {
          const { serviceId, modelId } = JSON.parse(value);
          const service = store.services.find((s) => s.id === serviceId)!;
          store.selected.model = {
            service,
            modelId,
          };
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
  );
}
