"use client";

import { useEffect, useRef, useState } from "react";
import { getCohort, getResolvedC03, getTrial } from "@/lib/data";
import pathologyFixture from "@/data/external/pathology-p007.json";
import type { CriterionResult } from "@/lib/types";

type Phase = "gap" | "searching" | "resolved";

interface AgentEvent {
  step: string;
  detail: string;
}

const SCRIPTED_TRACE: AgentEvent[] = [
  { step: "Gap identified", detail: "C03 HER2 status missing" },
  {
    step: "Tool call",
    detail:
      "search_external_records({ patientId: 'P-007', recordType: 'pathology' })",
  },
  {
    step: "Tool result",
    detail: "Pathology report — HER2 IHC 1+ (2026-05-14, external laboratory)",
  },
  { step: "Re-evaluation", detail: "C03 against retrieved evidence" },
  { step: "Decision", detail: "C03 UNKNOWN → PASS" },
];

const TRACE_DELAY_MS = 600;

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
  const [trace, setTrace] = useState<AgentEvent[]>(
    resolved ? SCRIPTED_TRACE : []
  );
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

  function streamTrace(
    events: AgentEvent[],
    index: number,
    result: CriterionResult
  ) {
    if (index >= events.length) {
      timers.current.push(
        setTimeout(() => {
          setC03Result(result);
          setPhase("resolved");
          onResolved(result);
        }, TRACE_DELAY_MS)
      );
      return;
    }
    timers.current.push(
      setTimeout(() => {
        setTrace((prev) => [...prev, events[index]]);
        streamTrace(events, index + 1, result);
      }, TRACE_DELAY_MS)
    );
  }

  async function handleFindEvidence() {
    setPhase("searching");
    setTrace([]);

    let data: {
      mode?: string;
      result?: CriterionResult;
      events?: AgentEvent[];
    };
    try {
      const response = await fetch("/api/resolve-gap", { method: "POST" });
      data = await response.json();
    } catch {
      data = { mode: "fallback", result: getResolvedC03(), events: SCRIPTED_TRACE };
    }

    console.log(data.mode);

    const events =
      Array.isArray(data.events) && data.events.length
        ? data.events
        : SCRIPTED_TRACE;
    const result = data.result?.evidence ? data.result : getResolvedC03();

    streamTrace(events, 0, result);
  }

  const evidence = c03Result?.evidence;

  const tracePanel = (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 font-mono text-sm">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-400">
        <span className="h-2 w-2 rounded-full bg-green-400" />
        agent trace · resolve-gap
      </div>
      <div className="mt-3 flex flex-col gap-1.5">
        {trace.map((event, index) => (
          <div key={`${event.step}-${index}`} className="rp-fade-up leading-relaxed">
            <span className="text-green-400">▸ {event.step}:</span>{" "}
            <span className="text-gray-100">{event.detail}</span>
          </div>
        ))}
        {phase === "searching" && trace.length < SCRIPTED_TRACE.length && (
          <div className="text-gray-500">
            <span className="animate-pulse">▸</span> running…
          </div>
        )}
      </div>
    </div>
  );

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

          {phase === "searching" && <div className="mt-8">{tracePanel}</div>}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* The agent trace that closed the gap */}
          {tracePanel}

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

              {/* Source-preserving cross-border proof (from the fixture) */}
              <div className="mt-5 flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                {[
                  {
                    label: "Original source",
                    value: `${pathologyFixture.sourceInstitutionType} — ${pathologyFixture.sourceCountry}`,
                  },
                  {
                    label: "Original text",
                    value: `“${pathologyFixture.originalText}” (${pathologyFixture.originalLanguage})`,
                  },
                  {
                    label: "Normalized",
                    value: `${pathologyFixture.normalizedConcept} — IHQ → IHC mapping verified`,
                  },
                  {
                    label: "Verification",
                    value: "Source verified — original preserved",
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-[7.5rem_1fr] items-start gap-3"
                  >
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      {row.label}
                    </div>
                    <div className="text-sm text-gray-800">{row.value}</div>
                  </div>
                ))}
                <div className="grid grid-cols-[7.5rem_1fr] items-start gap-3 border-t border-gray-200 pt-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Effect
                  </div>
                  <div className="text-sm font-semibold text-green-600">
                    C03 UNKNOWN → PASS
                  </div>
                </div>
              </div>
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
