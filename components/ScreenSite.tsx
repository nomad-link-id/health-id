"use client";

import { useState } from "react";
import { getTrial } from "@/lib/data";

export default function ScreenSite() {
  const [blocked, setBlocked] = useState(false);
  const trial = getTrial();
  const decisiveCriteria = trial.criteria.filter((c) => c.decisive);
  const totalCriteria = trial.criteria.length;

  return (
    <div className="flex flex-1 flex-col gap-8 px-16 py-10">
      <div>
        <div className="text-lg text-gray-500">Research Site A</div>
        <div className="mt-1 text-3xl font-bold text-gray-900">
          Consented candidate
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-8">
          <div className="flex items-baseline justify-between">
            <div className="text-xl font-bold text-gray-900">
              Eligibility proof — Pseudonymous candidate P-007
            </div>
            <div className="rounded-full bg-green-600 px-4 py-1 text-sm font-semibold text-white">
              {totalCriteria}/{totalCriteria} criteria supported
            </div>
          </div>

          <div className="flex flex-col divide-y divide-gray-100">
            {decisiveCriteria.map((criterion) => (
              <div
                key={criterion.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <span className="mr-2 text-xs font-medium text-gray-400">
                    {criterion.id}
                  </span>
                  <span className="text-base text-gray-900">
                    {criterion.label}
                  </span>
                </div>
                <div className="rounded-full bg-green-50 px-4 py-1 text-sm font-semibold text-green-600">
                  supported
                </div>
              </div>
            ))}
            <div className="py-3 text-sm text-gray-400">
              + 6 supporting criteria · evidence verified
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-8">
          <div className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            What the site received
          </div>
          <div className="flex items-center gap-2 text-lg text-gray-800">
            <span className="text-green-600">✓</span> Evidence verified
          </div>
          <div className="flex items-center gap-2 text-lg text-gray-800">
            <span className="text-green-600">✓</span> Patient approved contact
          </div>
          <div className="flex items-center gap-2 text-lg text-gray-800">
            <span className="text-green-600">✓</span> Full record not disclosed
          </div>
          <div className="mt-3 rounded-lg bg-blue-50 px-4 py-3 text-lg font-bold text-blue-700">
            READY FOR FORMAL SCREENING
          </div>
        </div>
      </div>

      <div className="max-w-3xl">
        <div className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Negative test
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <button
            onClick={() => setBlocked(true)}
            className="rounded-full border border-gray-300 px-6 py-3 text-lg font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Request full record
          </button>
          {blocked && <span className="text-2xl text-red-500">↓</span>}
        </div>

        {blocked && (
          <div className="rp-fade-up mt-4 rounded-xl border border-red-300 bg-red-50 px-6 py-5">
            <div className="text-xl font-bold text-red-700">
              Disclosure blocked
            </div>
            <div className="mt-1 text-base text-red-600">
              Outside patient consent scope. Only the eligibility proof is
              available — the full record was never shared and cannot be
              requested.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
