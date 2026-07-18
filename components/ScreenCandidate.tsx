"use client";

import { useEffect, useRef, useState } from "react";
import { getCohort, getResolvedC03, getTrial } from "@/lib/data";
import type { CriterionResult } from "@/lib/types";

type Phase = "gap" | "searching" | "resolved";

const SEARCH_SOURCES = [
  { label: "Searching oncology consult…", result: "no result" },
  { label: "Searching hospital EHR…", result: "no result" },
  { label: "Searching connected pathology…", result: "result found" },
];

const STEP_DELAY_MS = 950;

interface ScreenCandidateProps {
  resolved: boolean;
  resolvedResult: CriterionResult | null;
  onResolved: (result: CriterionResult) => void;
  onContinue: () => void;
}

export default function ScreenCandidate({
  resolved,
  resolvedResult,
  onResolved,
  onContinue,
}: ScreenCandidateProps) {
  const trial = getTrial();
  const evaluation = getCohort().find((p) => p.patientId === "P-007");
  const decisiveCriteria = trial.criteria.filter((c) => c.decisive);
  const baseResults = evaluation?.results ?? [];

  const [phase, setPhase] = useState<Phase>(resolved ? "resolved" : "gap");
  const [revealedSteps, setRevealedSteps] = useState(0);
  const [c03Result, setC03Result] = useState<CriterionResult | null>(
    resolved ? resolvedResult ?? getResolvedC03() : null
  );
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
    };
  }, []);

  async function handleFindEvidence() {
    setPhase("searching");
    setRevealedSteps(0);

    SEARCH_SOURCES.forEach((_, index) => {
      timers.current.push(
        setTimeout(() => setRevealedSteps(index + 1), (index + 1) * STEP_DELAY_MS)
      );
    });

    const fetchPromise = fetch("/api/resolve-gap", { method: "POST" })
      .then((response) => response.json())
      .then((data) => data.result as CriterionResult)
      .catch(() => getResolvedC03());

    const minAnimation = new Promise<void>((resolve) =>
      timers.current.push(
        setTimeout(resolve, SEARCH_SOURCES.length * STEP_DELAY_MS + 500)
      )
    );

    const [result] = await Promise.all([fetchPromise, minAnimation]);
    const finalResult = result?.evidence ? result : getResolvedC03();

    setC03Result(finalResult);
    setPhase("resolved");
    onResolved(finalResult);
  }

  const evidence = c03Result?.evidence;

  return (
    <div className="flex flex-1 flex-col gap-8 px-16 py-10">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-lg text-gray-500">Candidate detail</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">
            Patient P-007
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Evaluated inside the patient graph · nothing left the patient
        </div>
      </div>

      {/* HERO — the eligibility gap is the event of this screen */}
      {phase !== "resolved" ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-widest text-amber-600">
                Eligibility blocked
              </div>
              <div className="mt-2 text-4xl font-bold text-gray-900">
                1 missing fact
              </div>
              <div className="mt-2 text-2xl font-semibold text-amber-700">
                HER2-low biomarker status
              </div>
              <div className="mt-2 max-w-xl text-base text-gray-600">
                Every other decisive criterion is already supported by the
                patient graph. This one fact cannot be verified from the records
                on file.
              </div>
            </div>

            {phase === "gap" && (
              <button
                onClick={handleFindEvidence}
                className="shrink-0 rounded-full bg-blue-600 px-8 py-4 text-xl font-semibold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-700"
              >
                Find missing evidence
              </button>
            )}
          </div>

          {phase === "searching" && (
            <div className="mt-8 flex flex-col gap-3">
              {SEARCH_SOURCES.slice(0, revealedSteps).map((source, index) => {
                const isHit = source.result === "result found";
                return (
                  <div
                    key={source.label}
                    className="rp-fade-up flex items-center justify-between rounded-lg border border-gray-200 bg-white px-5 py-3 font-mono text-base"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <span className="text-gray-700">{source.label}</span>
                    <span
                      className={
                        isHit
                          ? "font-semibold text-green-600"
                          : "text-gray-400"
                      }
                    >
                      {source.result}
                    </span>
                  </div>
                );
              })}
              {revealedSteps < SEARCH_SOURCES.length && (
                <div className="text-sm font-medium text-gray-400">
                  Agent querying connected sources…
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* The proof that closed the gap */}
          {evidence && (
            <div className="rp-pop rounded-2xl border border-green-300 bg-white p-7">
              <div className="text-sm font-semibold uppercase tracking-widest text-green-600">
                External pathology report
              </div>
              <div className="mt-3 text-3xl font-bold text-gray-900">
                HER2 IHC 1+
              </div>
              <dl className="mt-5 flex flex-col gap-2 text-base text-gray-700">
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <dt className="text-gray-500">Source</dt>
                  <dd className="font-medium">{evidence.sourceName}</dd>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <dt className="text-gray-500">Date</dt>
                  <dd className="font-medium">{evidence.date}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Patient match</dt>
                  <dd className="font-semibold text-green-600">verified</dd>
                </div>
              </dl>
              {evidence.excerpt && (
                <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm italic text-gray-500">
                  “{evidence.excerpt}”
                </div>
              )}
            </div>
          )}

          {/* The transformation — the moment the judges remember */}
          <div className="rp-fade-in flex flex-col items-center justify-center rounded-2xl border border-green-300 bg-gradient-to-b from-green-50 to-white p-7 text-center">
            <div className="text-2xl font-semibold text-gray-400 line-through">
              Eligibility unknown
            </div>
            <div className="my-3 text-4xl text-green-500">↓</div>
            <div className="rp-pop text-5xl font-extrabold text-green-600">
              LIKELY ELIGIBLE
            </div>
            <button
              onClick={onContinue}
              className="mt-8 rounded-full bg-blue-600 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Continue to consent →
            </button>
          </div>
        </div>
      )}

      {/* Provenance table — trial criterion ↔ patient graph fact ↔ source */}
      <div>
        <div className="grid grid-cols-3 gap-4 border-b border-gray-200 pb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          <div>Trial criterion</div>
          <div>Patient graph fact</div>
          <div>Original source</div>
        </div>

        <div className="flex flex-col divide-y divide-gray-200">
          {decisiveCriteria.map((criterion) => {
            const base = baseResults.find((r) => r.criterionId === criterion.id);
            const result =
              criterion.id === "C03" && c03Result ? c03Result : base;
            const isPass = result?.status === "PASS";
            const isUnknown = result?.status === "UNKNOWN";
            const justResolved =
              criterion.id === "C03" && phase === "resolved";

            return (
              <div
                key={criterion.id}
                className={`grid grid-cols-3 gap-4 py-4 ${
                  justResolved ? "rp-fade-in rounded-lg bg-green-50/60" : ""
                }`}
              >
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
                    <div className="text-base font-medium text-gray-900">
                      {criterion.label}
                    </div>
                  </div>
                </div>

                <div className="text-base text-gray-800">
                  {result?.evidence ? (
                    result.evidence.statement
                  ) : (
                    <span className="italic text-amber-500">
                      No result on file
                    </span>
                  )}
                </div>

                <div>
                  {result?.evidence ? (
                    <div className="text-sm text-gray-600">
                      {result.evidence.sourceName}
                      <div className="text-xs text-gray-400">
                        {result.evidence.date}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 text-sm text-gray-500">
          6 decisive criteria shown — remaining 6 supported.
        </div>
      </div>
    </div>
  );
}
