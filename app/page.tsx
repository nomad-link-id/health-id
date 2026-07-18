"use client";

import { useCallback, useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import ScreenFragments from "@/components/ScreenFragments";
import ScreenCohort from "@/components/ScreenCohort";
import ScreenCandidate from "@/components/ScreenCandidate";
import ScreenConsent from "@/components/ScreenConsent";
import ScreenSite from "@/components/ScreenSite";
import type { CriterionResult } from "@/lib/types";

const LAST_BEAT = 5;

export default function Home() {
  const [beat, setBeat] = useState(1);
  const [graphCreated, setGraphCreated] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [gapResolved, setGapResolved] = useState(false);
  const [resolvedC03, setResolvedC03] = useState<CriterionResult | null>(null);
  const [proofApproved, setProofApproved] = useState(false);

  const canAdvance = useCallback(
    (current: number) => {
      if (current === 1) return graphCreated;
      if (current === 2) return scanned;
      if (current === 3) return gapResolved;
      if (current === 4) return proofApproved;
      return true;
    },
    [graphCreated, scanned, gapResolved, proofApproved]
  );

  const reset = useCallback(() => {
    setBeat(1);
    setGraphCreated(false);
    setScanned(false);
    setGapResolved(false);
    setResolvedC03(null);
    setProofApproved(false);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        setBeat((current) =>
          canAdvance(current) ? Math.min(current + 1, LAST_BEAT) : current
        );
      } else if (event.key === "ArrowLeft") {
        setBeat((current) => Math.max(current - 1, 1));
      } else if (event.key === "r" || event.key === "R") {
        reset();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canAdvance, reset]);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopBar
        step={beat}
        totalSteps={LAST_BEAT}
        disclosedLabel={
          proofApproved
            ? "1 eligibility proof shared — minimum disclosure"
            : undefined
        }
      />

      {beat === 1 && (
        <ScreenFragments
          created={graphCreated}
          onCreate={() => setGraphCreated(true)}
          onContinue={() => setBeat(2)}
        />
      )}
      {beat === 2 && (
        <ScreenCohort
          scanned={scanned}
          onScanned={() => setScanned(true)}
          onOpenCandidate={() => setBeat(3)}
        />
      )}
      {beat === 3 && (
        <ScreenCandidate
          resolved={gapResolved}
          resolvedResult={resolvedC03}
          onResolved={(result) => {
            setResolvedC03(result);
            setGapResolved(true);
          }}
          onContinue={() => setBeat(4)}
        />
      )}
      {beat === 4 && (
        <ScreenConsent
          approved={proofApproved}
          onApprove={() => setProofApproved(true)}
          onContinue={() => setBeat(5)}
        />
      )}
      {beat === 5 && <ScreenSite />}

      <footer className="border-t border-gray-200 px-10 py-4 text-xs text-gray-400">
        Synthetic patient data — demo only. No treatment or coverage decisions.
      </footer>
    </div>
  );
}
