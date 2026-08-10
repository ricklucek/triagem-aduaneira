import { Sparkles } from "lucide-react";

export function HighlightField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode | null;
}) {
  if (value == null || value === false || value === "") return null;

  return (
    <div className="break-inside-avoid rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-950 shadow-sm dark:border-amber-700/70 dark:bg-amber-950/35 dark:text-amber-100">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
        <Sparkles className="size-3.5" />
        {label}
      </div>
      <div className="whitespace-pre-line text-sm font-medium wrap-break-word">
        {value}
      </div>
    </div>
  );
}
