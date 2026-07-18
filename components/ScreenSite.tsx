"use client";

import { useState } from "react";
import { getTrial } from "@/lib/data";

export default function ScreenSite() {
  const [blocked, setBlocked] = useState(false);
  const trial = getTrial();
  const decisiveCriteria = trial.criteria.filter((c) => c.decisive);

  return (
    <div className="flex flex-1 flex-col gap-8 px-16 py-12">
      <div>
        <div className="text-lg text-gray-500">Research Site A</div>
        <div className="mt-1 text-2xl font-bold text-gray-900">
          CONSENTED CANDIDATE — Patient P-007
        </div>
      </div>

      <div className="flex max-w-2xl flex-col gap-3 rounded-xl border border-gray-200 bg-white p-8">
        {decisiveCriteria.map((criterion) => (
          <div
            key={criterion.id}
            className="flex items-center justify-between border-b border-gray-100 py-3 last:border-b-0"
          >
            <div>
              <span className="mr-2 text-xs font-medium text-gray-400">
                {criterion.id}
              </span>
              <span className="text-lg text-gray-900">{criterion.label}</span>
            </div>
            <div className="rounded-full bg-green-600 px-4 py-1 text-sm font-semibold text-white">
              supported
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 text-lg text-gray-700">
        <div>Patient approved contact</div>
        <div>Full record not disclosed</div>
        <div>Ready for formal screening</div>
      </div>

      {blocked && (
        <div className="max-w-2xl rounded-lg border border-red-300 bg-red-50 px-6 py-4 text-lg font-semibold text-red-700">
          DISCLOSURE BLOCKED — requested fields outside consent scope. Only
          the eligibility proof is available.
        </div>
      )}

      <button
        onClick={() => setBlocked(true)}
        className="w-fit rounded-full border border-gray-300 px-6 py-3 text-lg font-semibold text-gray-700 transition-colors hover:bg-gray-50"
      >
        Request full record
      </button>
    </div>
  );
}
