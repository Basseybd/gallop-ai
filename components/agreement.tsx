export function agreementLabel(value: number): string {
  if (value >= 0.999) return "Same five";
  if (value >= 0.6) return "Mostly agree";
  if (value >= 0.3) return "Some overlap";
  if (value > 0.1) return "Little overlap";
  return "Almost none";
}

/** A thin graphite rule on aluminum, filled to the agreement score. */
export function AgreementMeter({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-0.5 flex-1 bg-aluminum"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={`Agreement ${pct} percent`}
      >
        <div className="h-full bg-graphite" style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
      <span className="w-28 shrink-0 text-right text-sm text-secondary">{agreementLabel(value)}</span>
    </div>
  );
}
