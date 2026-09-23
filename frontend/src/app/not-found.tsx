import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <Logo size="lg" className="mx-auto" />
      <h1 className="mt-6 font-display text-4xl">That page is not on HOH</h1>
      <p className="mt-3 text-muted-foreground">Try search, or go back to the opportunity catalogue.</p>
    </div>
  );
}
