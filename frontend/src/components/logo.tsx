import { cn } from "@/lib/utils";

const sizes = {
  sm: "h-11",
  md: "h-14",
  lg: "h-20",
};

export function Logo({
  className,
  size = "md",
  tone = "auto",
}: {
  className?: string;
  size?: keyof typeof sizes;
  tone?: "auto" | "onDark";
}) {
  const height = sizes[size];

  if (tone === "onDark") {
    return <img src="/logo-dark.png" alt="HOH" className={cn("w-auto", height, className)} />;
  }

  return (
    <span className={cn("inline-flex items-center", className)}>
      <img src="/logo-light.png" alt="HOH" className={cn("w-auto dark:hidden", height)} />
      <img src="/logo-dark.png" alt="" aria-hidden className={cn("hidden w-auto dark:block", height)} />
    </span>
  );
}
