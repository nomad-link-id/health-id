"use client";

import { useState } from "react";

interface ScreenConsentProps {
  approved: boolean;
  onApprove: () => void;
  onContinue: () => void;
}

const SHARED = [
  "Age range",
  "Diagnosis",
  "HER2 status",
  "Prior treatment",
  "Contact permission",
];

const WITHHELD = [
  "Full clinical notes",
  "Unrelated diagnoses",
  "Complete medical record",
];

export default function ScreenConsent({
  approved,
  onApprove,
  onContinue,
}: ScreenConsentProps) {
  const [revoked, setRevoked] = useState(false);
  const [declined, setDeclined] = useState(false);

  return (
    <div className="flex flex-1 flex-col gap-8 px-16 py-10">
      <div>
        <div className="text-lg text-gray-500">Patient wallet</div>
        <div className="mt-1 text-3xl font-bold text-gray-900">
          Your Health ID
        </div>
        <div className="mt-2 max-w-2xl text-base text-gray-600">
          You matched a study. You decide what the trial is allowed to see.
        </div>
      </div>

      <div className="flex max-w-3xl flex-col gap-8 rounded-2xl border border-gray-200 bg-white p-8">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
          <div className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Connected sources
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700">
              US oncology EHR
            </span>
            <span className="text-gray-400">·</span>
            <span className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700">
              Pathology laboratory — Brazil
            </span>
          </div>
          <div className="mt-3 text-base text-gray-600">
            A pathology result from Brazil supports the required biomarker.
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <div className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              This trial requests permission to share
            </div>
            <ul className="mt-4 flex flex-col gap-3 text-lg text-gray-900">
              {SHARED.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-600">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              The following will NOT be shared
            </div>
            <ul className="mt-4 flex flex-col gap-3 text-lg text-gray-400">
              {WITHHELD.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-400">
                    ✕
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {!approved && !declined && (
          <div className="flex flex-wrap gap-4">
            <button
              onClick={onApprove}
              className="rounded-full bg-blue-600 px-8 py-4 text-xl font-semibold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-700"
            >
              Approve eligibility proof
            </button>
            <button
              onClick={() => setDeclined(true)}
              className="rounded-full border border-gray-300 px-6 py-4 text-lg font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Decline
            </button>
          </div>
        )}

        {!approved && declined && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-5 text-lg text-gray-600">
            You declined to share. No records were disclosed.{" "}
            <button
              onClick={() => setDeclined(false)}
              className="font-semibold text-blue-600 underline-offset-2 hover:underline"
            >
              Reconsider
            </button>
          </div>
        )}

        {approved && (
          <div className="rp-fade-up rounded-xl border border-green-200 bg-green-50 p-6">
            {!revoked ? (
              <div className="flex flex-col gap-2">
                <div className="text-lg font-semibold text-green-700">
                  Eligibility proof approved
                </div>
                <div className="text-base text-gray-700">
                  Shared with: Research Site A
                </div>
                <div className="text-base text-gray-700">
                  Scope: Eligibility proof only · 5 fields
                </div>
                <div className="text-base text-gray-700">Duration: 30 days</div>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <button
                    onClick={onContinue}
                    className="rounded-full bg-blue-600 px-7 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    See the research site view →
                  </button>
                  <button
                    onClick={() => setRevoked(true)}
                    className="rounded-full border border-red-300 px-5 py-2 text-base font-semibold text-red-600 transition-colors hover:bg-red-50"
                  >
                    Revoke access
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="text-lg font-semibold text-red-600">
                  Access revoked
                </div>
                <div className="text-base text-gray-600">
                  The proof is no longer available to the site. The patient
                  stays in control after the fact.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
