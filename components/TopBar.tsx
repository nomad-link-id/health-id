interface TopBarProps {
  disclosedLabel?: string;
  step?: number;
  totalSteps?: number;
}

const STEP_LABELS = [
  "Patient graph",
  "Cohort scan",
  "Candidate",
  "Consent",
  "Research site",
];

export default function TopBar({
  disclosedLabel = "Identifiable records disclosed: 0",
  step,
  totalSteps = STEP_LABELS.length,
}: TopBarProps) {
  const proofShared = disclosedLabel !== "Identifiable records disclosed: 0";

  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-10 py-5">
      <div>
        <div className="text-2xl font-bold tracking-tight text-gray-900">
          HEALTH ID
        </div>
        <div className="text-xs text-gray-400">Your data. Your life.</div>
        <div className="mt-1 text-sm text-gray-500">
          Patient-controlled · Source-preserving · Minimum disclosure
        </div>
      </div>

      {step ? (
        <div className="hidden items-center gap-2 md:flex">
          {Array.from({ length: totalSteps }).map((_, index) => {
            const active = index + 1 === step;
            const done = index + 1 < step;
            return (
              <div key={index} className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    active
                      ? "bg-blue-600 text-white"
                      : done
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {index + 1}
                </div>
                {index + 1 < totalSteps && (
                  <div
                    className={`h-0.5 w-6 ${done ? "bg-blue-200" : "bg-gray-200"}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      <div
        className={`rounded-full border px-5 py-2 text-sm font-medium transition-colors ${
          proofShared
            ? "border-blue-300 bg-blue-50 text-blue-700"
            : "border-emerald-300 bg-emerald-50 text-emerald-700"
        }`}
      >
        {disclosedLabel}
      </div>
    </div>
  );
}
