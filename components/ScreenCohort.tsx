import { getCohort, getTrial } from "@/lib/data";

const STATUS_STYLES: Record<string, string> = {
  LIKELY_ELIGIBLE: "bg-green-600 text-white",
  UNKNOWN: "bg-amber-500 text-white",
  INELIGIBLE: "bg-gray-400 text-white",
};

const STATUS_LABELS: Record<string, string> = {
  LIKELY_ELIGIBLE: "LIKELY ELIGIBLE",
  UNKNOWN: "ELIGIBILITY UNKNOWN",
  INELIGIBLE: "INELIGIBLE",
};

export default function ScreenCohort() {
  const trial = getTrial();
  const cohort = getCohort();

  const eligibleCount = cohort.filter((p) => p.overall === "LIKELY_ELIGIBLE").length;
  const unknownCount = cohort.filter((p) => p.overall === "UNKNOWN").length;
  const ineligibleCount = cohort.filter((p) => p.overall === "INELIGIBLE").length;

  return (
    <div className="flex flex-1 flex-col gap-10 px-16 py-12">
      <div>
        <div className="text-lg text-gray-500">{trial.title}</div>
        <div className="mt-1 text-xl font-semibold text-gray-900">
          Trial imported — {trial.criteria.length} eligibility criteria parsed
        </div>
      </div>

      <div>
        <div className="text-5xl font-bold text-gray-900">
          {cohort.length} patient graphs evaluated
        </div>
        <div className="mt-6 flex flex-wrap items-baseline gap-x-12 gap-y-4">
          <div className="text-3xl font-bold text-green-600">
            {eligibleCount} LIKELY ELIGIBLE
          </div>
          <div className="text-3xl font-bold text-amber-500">
            {unknownCount} ELIGIBILITY UNKNOWN
          </div>
          <div className="text-3xl font-bold text-gray-400">
            {ineligibleCount} INELIGIBLE
          </div>
        </div>
        <div className="mt-4 text-lg text-gray-500">
          0 identifiable records disclosed
        </div>
      </div>

      <div className="grid grid-cols-5 gap-5">
        {cohort.map((patient) => {
          const isHero = patient.patientId === "P-007";
          return (
            <div
              key={patient.patientId}
              className={`flex flex-col gap-3 rounded-xl border bg-white p-5 ${
                isHero
                  ? "ring-4 ring-offset-2 ring-blue-500 border-blue-500"
                  : "border-gray-200"
              }`}
            >
              <div className="text-lg font-semibold text-gray-900">
                {patient.patientId}
              </div>
              <div
                className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[patient.overall]}`}
              >
                {STATUS_LABELS[patient.overall]}
              </div>
              {patient.failedOn && (
                <div className="text-sm text-gray-500">{patient.failedOn}</div>
              )}
              {isHero && (
                <div className="mt-1 text-sm font-medium text-blue-600">
                  open →
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
