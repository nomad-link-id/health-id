import { getCohort, getTrial } from "@/lib/data";

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

export default function ScreenCandidate() {
  const trial = getTrial();
  const evaluation = getCohort().find((p) => p.patientId === "P-007");
  const decisiveCriteria = trial.criteria.filter((c) => c.decisive);
  const results = evaluation?.results ?? [];

  return (
    <div className="flex flex-1 flex-col gap-8 px-16 py-12">
      <div>
        <div className="text-lg text-gray-500">Candidate detail</div>
        <div className="mt-1 text-2xl font-bold text-gray-900">P-007</div>
      </div>

      <div className="grid grid-cols-3 gap-4 border-b border-gray-200 pb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
        <div>Trial criterion</div>
        <div>Patient graph fact</div>
        <div>Original source</div>
      </div>

      <div className="flex flex-col divide-y divide-gray-200">
        {decisiveCriteria.map((criterion) => {
          const result = results.find((r) => r.criterionId === criterion.id);
          const isPass = result?.status === "PASS";
          const isUnknown = result?.status === "UNKNOWN";

          return (
            <div key={criterion.id} className="grid grid-cols-3 gap-4 py-5">
              <div className="flex items-start gap-3">
                {isPass && (
                  <span className="mt-0.5 text-xl font-bold text-green-600">
                    ✓
                  </span>
                )}
                {isUnknown && (
                  <span className="mt-0.5 text-xl font-bold text-amber-500">
                    !
                  </span>
                )}
                <div>
                  <div className="text-xs font-medium text-gray-400">
                    {criterion.id}
                  </div>
                  <div className="text-lg font-medium text-gray-900">
                    {criterion.label}
                  </div>
                </div>
              </div>

              <div className="text-lg text-gray-800">
                {result?.evidence ? (
                  result.evidence.statement
                ) : (
                  <span className="italic text-gray-400">
                    Not available in patient graph
                  </span>
                )}
              </div>

              <div>
                {result?.evidence ? (
                  <div className="text-base text-gray-600">
                    {result.evidence.sourceName}
                    <div className="text-sm text-gray-400">
                      {result.evidence.date}
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-400">—</span>
                )}

                {isUnknown && result?.gap && (
                  <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                    <span className="font-semibold">Eligibility gap:</span>{" "}
                    {lowerFirst(result.gap.missing)}.{" "}
                    <span className="font-semibold">Minimum next step:</span>{" "}
                    {lowerFirst(result.gap.minimumNextStep)}.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-base text-gray-500">
        6 of 12 criteria shown — remaining 6 supported.
      </div>
    </div>
  );
}
