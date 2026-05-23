import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">Fresh Start</h1>
        <p className="mt-2 text-muted-foreground">
          Tell me what you'd like to build.
        </p>
      </div>
    </div>
  );
}
