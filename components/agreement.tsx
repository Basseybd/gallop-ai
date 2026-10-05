import { agreementLabels as L } from "@/content";

export function agreementLabel(value: number): string {
  if (value >= 0.999) return L.same;
  if (value >= 0.6) return L.mostly;
  if (value >= 0.3) return L.some;
  if (value > 0.1) return L.little;
  return L.none;
}

/**
 * A thin graphite rule on a hairline track, filled to the agreement score.
 * Inside a link, pass `decorative` so the bare number doesn't join the link's name; the visible label says it.
 */
export function AgreementMeter({ value, decorative = false }: { value: number; decorative?: boolean }) {
  const pct = Math.round(value * 100);
  const meter = decorative
    ? { "aria-hidden": true }
    : {
        role: "meter",
        "aria-valuemin": 0,
        "aria-valuemax": 100,
        "aria-valuenow": pct,
        "aria-valuetext": L.sr(pct).replace(/\.$/, ""),
        "aria-label": L.sr(pct).replace(/\.$/, ""),
      };
  return (
    <div className="flex items-center gap-3">
      <div className="h-0.5 flex-1 bg-hairline" {...meter}>
        <div className="h-full bg-graphite" style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
      <span className="w-28 shrink-0 text-right text-sm text-secondary">{agreementLabel(value)}</span>
    </div>
  );
}
