import * as React from "react";
import { cn } from "@/lib/utils";

export function Avatar({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "relative flex size-9 shrink-0 overflow-hidden rounded-full border bg-muted",
        className,
      )}
      {...props}
    />
  );
}

export function AvatarImage({
  className,
  alt,
  ...props
}: React.ComponentProps<"img">) {
  return (
    <img
      className={cn("aspect-square size-full", className)}
      alt={alt ?? "Avatar"}
      {...props}
    />
  );
}

export function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "flex size-full items-center justify-center bg-primary/10 text-xs font-semibold text-primary",
        className,
      )}
      {...props}
    />
  );
}
