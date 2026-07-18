"use client";

import { useState } from "react";

interface ScreenConsentProps {
  shared: boolean;
  onShare: () => void;
}

const REQUESTED = [
  "Age range",
  "Breast cancer diagnosis",
  "HER2 status",
  "Prior treatment lines",
];

const NOT_REQUESTED = [
  "Unrelated diagnoses",
  "Complete notes",
  "Full medical history",
];

export default function ScreenConsent({ shared, onShare }: ScreenConsentProps) {
  const [revoked, setRevoked] = useState(false);
  const [declined, setDeclined] = useState(false);

  return (
    <div className="flex flex-1 flex-col gap-8 px-16 py-12">
      <div>
        <div className="text-lg text-gray-500">Patient consent</div>
        <div className="mt-1 text-2xl font-bold text-gray-900">
          You may qualify for a clinical study.
        </div>
      </div>

      <div className="flex max-w-2xl flex-col gap-8 rounded-xl border border-gray-200 bg-white p-8">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Requested disclosure
            </div>
            <ul className="mt-3 flex flex-col gap-2 text-lg text-gray-900">
              {REQUESTED.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Not requested
            </div>
            <ul className="mt-3 flex flex-col gap-2 text-lg text-gray-400">
              {NOT_REQUESTED.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span>—</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {!shared && !declined && (
          <div className="flex gap-4">
            <button
              onClick={onShare}
              className="rounded-full bg-blue-600 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Share eligibility proof
            </button>
            <button
              onClick={() => setDeclined(true)}
              className="rounded-full border border-gray-300 px-6 py-3 text-lg font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Decline
            </button>
          </div>
        )}

        {!shared && declined && (
          <div className="text-lg text-gray-500">
            You declined to share. No records were disclosed.
          </div>
        )}

        {shared && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
            {!revoked ? (
              <div className="flex flex-col gap-2">
                <div className="text-lg font-semibold text-gray-900">
                  Permission: Trial discovery
                </div>
                <div className="text-base text-gray-700">
                  Shared with: Research Site A
                </div>
                <div className="text-base text-gray-700">
                  Scope: Eligibility proof only
                </div>
                <div className="text-base text-gray-700">
                  Duration: 30 days
                </div>
                <button
                  onClick={() => setRevoked(true)}
                  className="mt-4 w-fit rounded-full border border-red-300 px-5 py-2 text-base font-semibold text-red-600 transition-colors hover:bg-red-50"
                >
                  Revoke access
                </button>
              </div>
            ) : (
              <div className="text-lg font-semibold text-red-600">
                Access revoked
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
