import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  compact?: boolean;
}

export function Logo({ className, compact }: LogoProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-semibold lowercase tracking-tight text-foreground",
        className
      )}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/15 text-sm font-semibold text-primary shadow-soft">
        ev
      </span>
      {!compact && (
        <span className="text-xl font-semibold text-foreground">
          entrevisto
        </span>
      )}
    </span>
  );
}
