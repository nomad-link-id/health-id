"use client";

import { useEffect, useRef, useState } from "react";
import type { CriterionResult } from "@/lib/types";

const STEPS = [
  "Agent reviewing gap",
  "Searching external sources",
  "Evaluating pathology report",
  "Recomputing eligibility",
];

type ResolveResponse = {
  mode: "live" | "fallback";
  toolCalled?: boolean;
  result: CriterionResult;
  updatedOverall: string;
};

export default function ScreenGapResolution() {
  const [status, setStatus] = useState<"idle" | "pending" | "done">("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [resolved, setResolved] = useState<ResolveResponse | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  async function handleResolve() {
    setStatus("pending");
    setStepIndex(0);

    intervalRef.current = setInterval(() => {
      setStepIndex((current) => Math.min(current + 1, STEPS.length - 1));
    }, 2500);

    try {
      const response = await fetch("/api/resolve-gap", { method: "POST" });
      const data: ResolveResponse = await response.json();
      console.log(data.mode);
      setResolved(data);
    } finally {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setStatus("done");
    }
  }

  const evidence = resolved?.result.evidence;

  return (
    <div className="flex flex-1 flex-col gap-8 px-16 py-12">
      <div>
        <div className="text-lg text-gray-500">Gap resolution</div>
        <div className="mt-1 text-2xl font-bold text-gray-900">P-007</div>
      </div>

      {status === "done" && resolved && (
        <div className="rounded-xl border border-green-300 bg-green-50 px-6 py-4 text-xl font-semibold text-green-700">
          ELIGIBILITY UNKNOWN → LIKELY ELIGIBLE
        </div>
      )}

      <div className="flex flex-col gap-6 rounded-xl border border-gray-200 bg-white p-8">
        {status !== "done" || !resolved ? (
          <>
            <div>
              <div className="text-xs font-medium text-gray-400">C03</div>
              <div className="text-2xl font-bold text-amber-500">
                HER2 status: UNKNOWN
              </div>
            </div>
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-base text-amber-800">
              <span className="font-semibold">Eligibility gap:</span> no HER2
              result found in the record.{" "}
              <span className="font-semibold">Minimum next step:</span>{" "}
              request or connect the latest pathology report.
            </div>

            {status === "idle" && (
              <button
                onClick={handleResolve}
                className="w-fit rounded-full bg-blue-600 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Resolve eligibility gap
              </button>
            )}

            {status === "pending" && (
              <div className="text-lg font-medium text-gray-600">
                {STEPS[stepIndex]}…
              </div>
            )}
          </>
        ) : (
          <>
            <div>
              <div className="text-xs font-medium text-gray-400">C03</div>
              <div className="text-2xl font-bold text-green-600">
                HER2 status: PASS
              </div>
            </div>

            {evidence && (
              <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-base text-gray-800">
                <div className="font-medium">{evidence.statement}</div>
                <div className="mt-2 text-sm text-gray-600">
                  {evidence.sourceName} · {evidence.date}
                </div>
                <div className="mt-2 text-sm italic text-gray-500">
                  “{evidence.excerpt}”
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
