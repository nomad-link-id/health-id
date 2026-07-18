import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getTrial } from "@/lib/data";
import fallbackTrial from "@/data/parsed-trial-fallback.json";
import cachedStudy from "@/data/external/nct03734029-cached.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NCT_ID = "NCT03734029";
const MODEL = "claude-sonnet-4-6";
const FETCH_TIMEOUT_MS = 8000;
const LLM_TIMEOUT_MS = 20000;

type RegistryStudy = typeof cachedStudy;

interface ParsedCriterion {
  id: string;
  label: string;
  matchedFromRegistry: boolean;
}

const SYSTEM_PROMPT = `You are a clinical trial eligibility parser.

You are given (a) the raw eligibility-criteria text from a ClinicalTrials.gov registry entry and (b) a fixed 12-criterion schema (id + current label). For EACH criterion in the schema, if the registry text clearly covers that concept, rewrite the label using concise wording drawn from the registry text and set matchedFromRegistry to true. If the registry text does not clearly cover it, keep the original label unchanged and set matchedFromRegistry to false.

Rules:
- Return all 12 criteria, in the same order, with identical ids.
- Labels must be short (a single clause), no leading bullet or numbering.
- Do not invent criteria that are not in the schema.

Reply with STRICT JSON only, no prose outside the JSON object, in exactly this shape:
{"criteria": [{"id": string, "label": string, "matchedFromRegistry": boolean}]}`;

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

function extractMeta(study: RegistryStudy) {
  const ps = study?.protocolSection ?? {};
  const idm = ps.identificationModule ?? {};
  return {
    nctId: idm.nctId ?? NCT_ID,
    officialTitle: idm.officialTitle ?? "",
    briefTitle: idm.briefTitle ?? "",
    title: idm.briefTitle || idm.officialTitle || "",
    phase: formatPhase(ps.designModule?.phases),
    sponsor: ps.sponsorCollaboratorsModule?.leadSponsor?.name ?? "Unknown sponsor",
    eligibilityText: ps.eligibilityModule?.eligibilityCriteria ?? "",
  };
}

async function loadStudy(): Promise<RegistryStudy> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(
      `https://clinicaltrials.gov/api/v2/studies/${NCT_ID}`,
      { signal: controller.signal, cache: "no-store" }
    );
    if (!response.ok) throw new Error(`registry status ${response.status}`);
    return (await response.json()) as RegistryStudy;
  } catch {
    return cachedStudy as RegistryStudy;
  } finally {
    clearTimeout(timeoutId);
  }
}

function fallbackResponse() {
  return NextResponse.json({ mode: "fallback", trial: fallbackTrial });
}

function extractCriteria(text: string): ParsedCriterion[] | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    if (!parsed || !Array.isArray(parsed.criteria)) return null;
    const criteria = parsed.criteria as unknown[];
    if (criteria.length !== 12) return null;
    const normalized: ParsedCriterion[] = [];
    for (const raw of criteria) {
      if (!raw || typeof raw !== "object") return null;
      const c = raw as Record<string, unknown>;
      if (typeof c.id !== "string" || typeof c.label !== "string") return null;
      normalized.push({
        id: c.id,
        label: c.label,
        matchedFromRegistry: Boolean(c.matchedFromRegistry),
      });
    }
    return normalized;
  } catch {
    return null;
  }
}

export async function POST() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return fallbackResponse();
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  try {
    const study = await loadStudy();
    const meta = extractMeta(study);
    if (!meta.title || !meta.eligibilityText) {
      return fallbackResponse();
    }

    const schema = getTrial().criteria.map((c) => ({
      id: c.id,
      label: c.label,
    }));

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create(
      {
        model: MODEL,
        max_tokens: 1200,
        temperature: 0,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Registry eligibility text:\n${meta.eligibilityText}\n\n12-criterion schema:\n${JSON.stringify(
              schema,
              null,
              2
            )}`,
          },
        ],
      },
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === "text"
    );
    const criteria = textBlock ? extractCriteria(textBlock.text) : null;
    if (!criteria) {
      return fallbackResponse();
    }

    return NextResponse.json({
      mode: "live",
      trial: {
        nctId: meta.nctId,
        title: meta.title,
        phase: meta.phase,
        sponsor: meta.sponsor,
        criteria,
      },
    });
  } catch {
    return fallbackResponse();
  } finally {
    clearTimeout(timeoutId);
  }
}
