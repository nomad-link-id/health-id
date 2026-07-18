import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NCT_ID = "NCT03734029";
const STUDY_URL = `https://clinicaltrials.gov/api/v2/studies/${NCT_ID}`;
const CACHED_PATH = path.join(
  process.cwd(),
  "data/external/nct03734029-cached.json"
);
const FETCH_TIMEOUT_MS = 8000;

interface RegistryStudy {
  protocolSection?: {
    identificationModule?: {
      nctId?: string;
      officialTitle?: string;
      briefTitle?: string;
    };
    designModule?: { phases?: string[] };
    sponsorCollaboratorsModule?: { leadSponsor?: { name?: string } };
    eligibilityModule?: { eligibilityCriteria?: string };
  };
}

interface StudyExtract {
  nctId: string;
  title: string;
  phase: string;
  sponsor: string;
  eligibilityCriteria: string;
}

function formatPhase(phases: string[] | undefined): string {
  const phase = phases?.[0];
  if (!phase) return "Phase (not specified)";
  const map: Record<string, string> = {
    EARLY_PHASE1: "Early Phase 1",
    PHASE1: "Phase 1",
    PHASE2: "Phase 2",
    PHASE3: "Phase 3",
    PHASE4: "Phase 4",
    NA: "N/A",
  };
  return map[phase] ?? phase;
}

function extract(study: RegistryStudy): StudyExtract {
  const ps = study?.protocolSection ?? {};
  const idm = ps.identificationModule ?? {};
  return {
    nctId: idm.nctId ?? NCT_ID,
    title: idm.officialTitle ?? idm.briefTitle ?? "",
    phase: formatPhase(ps.designModule?.phases),
    sponsor: ps.sponsorCollaboratorsModule?.leadSponsor?.name ?? "",
    eligibilityCriteria: ps.eligibilityModule?.eligibilityCriteria ?? "",
  };
}

export async function POST() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(STUDY_URL, {
        signal: controller.signal,
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`registry status ${response.status}`);
      const study = (await response.json()) as RegistryStudy;
      const data = extract(study);
      if (!data.title || !data.eligibilityCriteria) {
        throw new Error("incomplete live registry response");
      }
      return NextResponse.json({
        mode: "live",
        nctId: data.nctId,
        title: data.title,
        phase: data.phase,
        sponsor: data.sponsor,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch {
    const raw = await readFile(CACHED_PATH, "utf8");
    const study = JSON.parse(raw) as RegistryStudy;
    const data = extract(study);
    return NextResponse.json({
      mode: "cached",
      nctId: data.nctId,
      title: data.title,
      phase: data.phase,
      sponsor: data.sponsor,
    });
  }
}
