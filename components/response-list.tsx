import { useSnapshot } from "valtio";
import { store } from "@/app/store";
import { ResponseCard } from "@/components/response-card";

export function ResponseList() {
  const responses = useSnapshot(store.responses);
  return (
    <div className="space-y-2">
      {responses.map((response, index) => (
        <ResponseCard key={response.id} index={index} />
      ))}
    </div>
  );
}
