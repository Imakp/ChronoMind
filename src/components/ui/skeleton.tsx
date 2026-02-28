import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted border border-border/20",
        "loading-skeleton", // Use the warm gray loading blocks from globals.css
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
