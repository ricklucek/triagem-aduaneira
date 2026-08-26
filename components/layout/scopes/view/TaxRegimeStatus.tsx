import { Info, ShieldCheck, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  label?: string;
  regime?: string | null;
  description?: React.ReactNode | null;
  showDescription?: boolean;
};

export function TaxRegimeStatus({
  label = "Regime",
  regime,
  description,
  showDescription = true,
}: Props) {
  if (!regime) return null;

  const isIntegral = regime === "INTEGRAL";
  const isBenefit = regime === "BENEFICIO";
  const Icon = isBenefit ? TriangleAlert : isIntegral ? ShieldCheck : Info;
  const statusLabel = isBenefit
    ? "Benefício"
    : isIntegral
      ? "Integral"
      : regime;
  const hasDescription =
    description != null && description !== false && description !== "";

  return (
    <div
      className={cn(
        "break-inside-avoid rounded-xl border p-3 shadow-sm [print-color-adjust:exact]",
        isBenefit &&
          "border-red-300 bg-red-50 text-red-950 dark:border-red-700/70 dark:bg-red-950/35 dark:text-red-100",
        isIntegral &&
          "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-700/70 dark:bg-emerald-950/35 dark:text-emerald-100",
        !isBenefit &&
          !isIntegral &&
          "border-border bg-muted/30 text-foreground",
      )}
    >
      <p
        className={cn(
          "mb-1.5 text-xs font-semibold uppercase tracking-wide",
          isBenefit && "text-red-700 dark:text-red-300",
          isIntegral && "text-emerald-700 dark:text-emerald-300",
          !isBenefit && !isIntegral && "text-muted-foreground",
        )}
      >
        {label}
      </p>

      <div className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        <span>{statusLabel}</span>
      </div>

      {isBenefit && showDescription ? (
        <div className="mt-3 border-t border-red-200 pt-3 dark:border-red-800/70">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
            Detalhes do benefício
          </p>
          <div className="whitespace-pre-line text-sm font-medium wrap-break-word">
            {hasDescription
              ? description
              : "Descrição do benefício não informada."}
          </div>
        </div>
      ) : null}
    </div>
  );
}
