import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { UserTag } from "@/lib/api/types/dashboard-api";

const colorClasses: Record<UserTag["color"], string> = {
  slate: "border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
  blue: "border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200",
  emerald: "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  amber: "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
  violet: "border-violet-300 bg-violet-100 text-violet-800 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-200",
  rose: "border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200",
};

export function UserTagBadge({
  tag,
  className,
}: {
  tag: UserTag;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(colorClasses[tag.color], !tag.active && "opacity-50", className)}
    >
      {tag.is_master ? <ShieldCheck className="size-3" /> : null}
      {tag.name}
    </Badge>
  );
}
