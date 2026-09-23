import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-primary", className)}
      {...props}
    />
  );
}

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("rounded-3xl border border-border bg-card shadow-[0_12px_40px_-28px_rgba(16,35,28,0.45)]", className)} {...props} />;
}
