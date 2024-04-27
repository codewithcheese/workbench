import { LoaderCircleIcon } from "lucide-react";

export function Splash({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50">
      <div className="flex flex-col items-center space-y-4">
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
          <LoaderCircleIcon size={24} className="loading-icon" />
        </p>
        <p>{message}</p>
      </div>
    </div>
  );
}
