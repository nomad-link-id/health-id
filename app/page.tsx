"use client";

import { useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import ScreenCohort from "@/components/ScreenCohort";
import ScreenCandidate from "@/components/ScreenCandidate";
import ScreenGapResolution from "@/components/ScreenGapResolution";
import ScreenConsent from "@/components/ScreenConsent";
import ScreenSite from "@/components/ScreenSite";

export default function Home() {
  const [beat, setBeat] = useState(1);
  const [proofShared, setProofShared] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        setBeat((current) => {
          if (current === 4 && !proofShared) return current;
          return Math.min(current + 1, 5);
        });
      } else if (event.key === "ArrowLeft") {
        setBeat((current) => Math.max(current - 1, 1));
      } else if (event.key === "r" || event.key === "R") {
        setBeat(1);
        setProofShared(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [proofShared]);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopBar
        disclosedLabel={
          proofShared
            ? "1 eligibility proof shared — minimum disclosure"
            : undefined
        }
      />
      {beat === 1 && (
        <ScreenCohort onOpenCandidate={() => setBeat(2)} />
      )}
      {beat === 2 && <ScreenCandidate />}
      {beat === 3 && <ScreenGapResolution />}
      {beat === 4 && (
        <ScreenConsent
          shared={proofShared}
          onShare={() => setProofShared(true)}
        />
      )}
      {beat === 5 && <ScreenSite />}
      <footer className="border-t border-gray-200 px-10 py-4 text-xs text-gray-400">
        Synthetic data — demo only. No treatment or coverage decisions.
      </footer>
    </div>
  );
}
