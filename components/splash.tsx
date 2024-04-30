export function Splash({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50">
      <div className="flex flex-col items-center space-y-4">{children}</div>
    </div>
  );
}
