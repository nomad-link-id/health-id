"use client";

import { useEffect, useRef, useState } from "react";
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

const SCAN_STEPS = [
  "Parsing 12 trial criteria",
  "Searching 10 patient graphs",
  "Verifying criterion-level evidence",
  "Protecting patient identity",
];

const STEP_DELAY_MS = 700;

const NCT_ID = "NCT03734029";

interface ImportedTrial {
  mode: string;
  nctId: string;
  title: string;
  phase: string;
  sponsor: string;
}

interface ScreenCohortProps {
  scanned: boolean;
  onScanned: () => void;
  onOpenCandidate: () => void;
}

export default function ScreenCohort({
  scanned,
  onScanned,
  onOpenCandidate,
}: ScreenCohortProps) {
  const trial = getTrial();
  const cohort = getCohort();

  const eligibleCount = cohort.filter(
    (p) => p.overall === "LIKELY_ELIGIBLE"
  ).length;
  const unknownCount = cohort.filter((p) => p.overall === "UNKNOWN").length;
  const ineligibleCount = cohort.filter(
    (p) => p.overall === "INELIGIBLE"
  ).length;

  const [phase, setPhase] = useState<"idle" | "scanning" | "done">(
    scanned ? "done" : "idle"
  );
  const [step, setStep] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [importPhase, setImportPhase] = useState<
    "idle" | "importing" | "done"
  >("idle");
  const [importedTrial, setImportedTrial] = useState<ImportedTrial | null>(null);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  async function handleImport() {
    setImportPhase("importing");
    try {
      const response = await fetch("/api/import-trial", { method: "POST" });
      const data = await response.json();
      console.log(data.mode);
      setImportedTrial(data as ImportedTrial);
      setImportPhase("done");
    } catch {
      setImportPhase("idle");
    }
  }

  function handleScan() {
    setPhase("scanning");
    setStep(0);

    SCAN_STEPS.forEach((_, index) => {
      timers.current.push(
        setTimeout(() => setStep(index + 1), (index + 1) * STEP_DELAY_MS)
      );
    });

    timers.current.push(
      setTimeout(() => {
        setPhase("done");
        onScanned();
      }, SCAN_STEPS.length * STEP_DELAY_MS + 400)
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-8 px-16 py-10">
      <div>
        {importedTrial ? (
          <>
            <div className="text-lg text-gray-500">{importedTrial.title}</div>
            <div className="mt-1 text-xl font-semibold text-gray-900">
              {importedTrial.nctId} · {importedTrial.phase} · imported from
              ClinicalTrials.gov
            </div>
          </>
        ) : (
          <>
            <div className="text-lg text-gray-500">{trial.title}</div>
            <div className="mt-1 text-xl font-semibold text-gray-900">
              Trial imported — {trial.criteria.length} eligibility criteria
              parsed
            </div>
          </>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            readOnly
            value={NCT_ID}
            aria-label="ClinicalTrials.gov identifier"
            className="w-40 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 font-mono text-base text-gray-700"
          />
          <button
            onClick={handleImport}
            disabled={importPhase === "importing" || importPhase === "done"}
            className="rounded-full bg-gray-900 px-5 py-2 text-base font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Import from ClinicalTrials.gov
          </button>
          {importPhase === "importing" && (
            <span className="text-base font-medium text-gray-500">
              Trial Parser Agent — parsing eligibility criteria…
            </span>
          )}
          {importPhase === "done" && (
            <span className="text-base font-medium text-green-600">
              ✓ imported
            </span>
          )}
        </div>
      </div>

      {phase === "idle" && (
        <div className="flex flex-col items-start gap-5 rounded-2xl border border-gray-200 bg-white p-10">
          <div className="max-w-2xl">
            <div className="text-2xl font-bold text-gray-900">
              10 private patient graphs are ready to evaluate.
            </div>
            <div className="mt-2 text-base text-gray-600">
              The criteria travel to each patient graph. No chart is copied, no
              record leaves the patient. This is not a SQL filter over a
              database — each criterion is checked against the evidence in every
              graph, without ever identifying anyone.
            </div>
          </div>
          <button
            onClick={handleScan}
            className="rounded-full bg-blue-600 px-8 py-4 text-xl font-semibold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-700"
          >
            Run private patient-graph scan
          </button>
        </div>
      )}

      {phase === "scanning" && (
        <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-10">
          <div className="text-lg font-semibold text-gray-500">
            Running private scan…
          </div>
          <div className="flex flex-col gap-3">
            {SCAN_STEPS.map((label, index) => {
              const active = index < step;
              return (
                <div
                  key={label}
                  className={`flex items-center gap-3 font-mono text-lg transition-colors ${
                    active ? "text-gray-900" : "text-gray-300"
                  }`}
                >
                  <span
                    className={
                      active ? "text-green-600" : "text-gray-300"
                    }
                  >
                    {active ? "✓" : "○"}
                  </span>
                  {label}
                  {active && index === step - 1 && step < SCAN_STEPS.length && (
                    <span className="text-gray-400">…</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {phase === "done" && (
        <>
          <div className="rp-fade-up">
            <div className="flex flex-wrap items-baseline gap-x-10 gap-y-3">
              <div className="text-3xl font-bold text-green-600">
                {eligibleCount} likely eligible
              </div>
              <div className="text-3xl font-bold text-amber-500">
                {unknownCount} eligibility unknown
              </div>
              <div className="text-3xl font-bold text-gray-400">
                {ineligibleCount} ineligible
              </div>
            </div>
            <div className="mt-6 inline-flex items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-6 py-4">
              <span className="text-4xl font-extrabold text-emerald-600">0</span>
              <span className="text-xl font-semibold text-emerald-700">
                identifiable records disclosed
              </span>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-5">
            {cohort.map((patient) => {
              const isHero = patient.patientId === "P-007";
              return (
                <div
                  key={patient.patientId}
                  onClick={isHero ? onOpenCandidate : undefined}
                  className={`flex flex-col gap-3 rounded-xl border bg-white p-5 transition-shadow ${
                    isHero
                      ? "cursor-pointer border-blue-500 ring-4 ring-blue-500 ring-offset-2 hover:shadow-lg"
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
                    <div className="text-sm text-gray-500">
                      {patient.failedOn}
                    </div>
                  )}
                  {isHero && (
                    <>
                      <div className="text-sm text-amber-600">
                        1 missing fact: HER2 status
                      </div>
                      <div className="mt-1 text-sm font-semibold text-blue-600">
                        open candidate →
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
