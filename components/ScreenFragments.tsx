"use client";

interface ScreenFragmentsProps {
  created: boolean;
  onCreate: () => void;
  onContinue: () => void;
}

const SOURCES = [
  { name: "Hospital EHR", detail: "Consult notes · imaging", pos: "left-[16%] top-[24%]" },
  { name: "External pathology lab", detail: "Biomarker reports", pos: "left-[84%] top-[24%]" },
  { name: "Previous oncology clinic", detail: "Treatment history", pos: "left-[16%] top-[80%]" },
  { name: "Patient-uploaded record", detail: "Self-reported data", pos: "left-[84%] top-[80%]" },
];

const NODE_POINTS = [
  { x: 16, y: 24 },
  { x: 84, y: 24 },
  { x: 16, y: 80 },
  { x: 84, y: 80 },
];

export default function ScreenFragments({
  created,
  onCreate,
  onContinue,
}: ScreenFragmentsProps) {
  return (
    <div className="flex flex-1 flex-col gap-8 px-16 py-10">
      <div>
        <div className="text-lg text-gray-500">Before we can match anything</div>
        <div className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
          {created ? "PRIVATE PATIENT GRAPH CREATED" : "PATIENT DATA IS FRAGMENTED"}
        </div>
        <div className="mt-2 max-w-2xl text-base text-gray-600">
          {created
            ? "The scattered records now form one structured, source-preserving graph — held under the patient's control, not shipped to a sponsor."
            : "A single patient's facts are scattered across systems that never talk to each other. Trial matching today ships all of this somewhere. We do the opposite."}
        </div>
      </div>

      <div className="relative mx-auto h-[440px] w-full max-w-4xl">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {NODE_POINTS.map((point, index) =>
            created ? (
              <line
                key={index}
                x1={point.x}
                y1={point.y}
                x2={50}
                y2={50}
                stroke="#3b82f6"
                strokeWidth="0.4"
                className="rp-draw"
                style={{
                  ["--rp-dash" as string]: "120",
                  animationDelay: `${index * 150}ms`,
                }}
              />
            ) : (
              <line
                key={index}
                x1={point.x}
                y1={point.y}
                x2={50}
                y2={50}
                stroke="#e5e7eb"
                strokeWidth="0.3"
                strokeDasharray="1.5 1.5"
              />
            )
          )}
        </svg>

        {SOURCES.map((source) => (
          <div
            key={source.name}
            className={`absolute w-52 -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-white p-4 text-center shadow-sm transition-colors ${source.pos} ${
              created ? "border-blue-300" : "border-gray-200"
            }`}
          >
            <div className="text-base font-semibold text-gray-900">
              {source.name}
            </div>
            <div className="mt-1 text-xs text-gray-500">{source.detail}</div>
          </div>
        ))}

        <div
          className={`absolute left-1/2 top-1/2 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full text-center transition-all ${
            created
              ? "rp-pop border-4 border-blue-500 bg-blue-50 text-blue-700 shadow-lg"
              : "border-2 border-dashed border-gray-300 bg-white text-gray-400"
          }`}
        >
          <div className="text-2xl font-bold">P-007</div>
          <div className="px-2 text-xs font-medium">
            {created ? "Patient graph" : "not yet linked"}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        {!created ? (
          <button
            onClick={onCreate}
            className="rounded-full bg-blue-600 px-8 py-4 text-xl font-semibold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-700"
          >
            Create private patient graph
          </button>
        ) : (
          <button
            onClick={onContinue}
            className="rp-fade-up rounded-full bg-blue-600 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Scan the cohort →
          </button>
        )}
      </div>
    </div>
  );
}
