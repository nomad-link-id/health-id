import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  getPatient,
  getTrial,
  getExternalPathology,
  getResolvedC03,
} from "@/lib/data";
import type { CriterionResult } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-sonnet-4-6";
const MAX_TURNS = 3;
const TIMEOUT_MS = 25000;

const SYSTEM_PROMPT = `You are an eligibility verification agent for a clinical trial matching system.

Criterion C03 (HER2-low: IHC 1+ or IHC 2+/ISH-) has no result in the patient's record. Decide whether to call the search_external_records tool to retrieve the latest pathology report for this patient. After retrieving a result (or if you determine one cannot be retrieved), re-evaluate ONLY criterion C03.

Reply with STRICT JSON only, no prose outside the JSON object, in exactly this shape:
{"criterionId": "C03", "status": "PASS"|"FAIL"|"UNKNOWN", "evidence": {"statement": string, "sourceType": string, "sourceName": string, "date": string, "excerpt": string}, "rationale": string}`;

const SEARCH_TOOL: Anthropic.Tool = {
  name: "search_external_records",
  description:
    "Search external/connected medical record sources for a patient. Returns the most recent matching record, if any, including its original source metadata.",
  input_schema: {
    type: "object",
    properties: {
      patientId: {
        type: "string",
        description: "The patient identifier, e.g. P-007",
      },
      recordType: {
        type: "string",
        description: "The type of record to search for, e.g. pathology report",
      },
    },
    required: ["patientId", "recordType"],
  },
};

function fallbackResponse() {
  return NextResponse.json({
    mode: "fallback",
    result: getResolvedC03(),
    updatedOverall: "LIKELY_ELIGIBLE",
  });
}

function extractJson(text: string): CriterionResult | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    if (!parsed || typeof parsed !== "object" || !parsed.criterionId || !parsed.status) {
      return null;
    }
    return parsed as CriterionResult;
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
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const patient = getPatient("P-007");
    const trial = getTrial();
    const criterion = trial.criteria.find((c) => c.id === "C03");

    const client = new Anthropic({ apiKey });

    const messages: Anthropic.MessageParam[] = [
      {
        role: "user",
        content: `Trial criterion C03: ${criterion?.label}\n\nPatient P-007 graph (biomarker facts):\n${JSON.stringify(
          patient?.facts.biomarkers,
          null,
          2
        )}`,
      },
    ];

    let toolCalled = false;
    let finalText: string | null = null;

    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const response = await client.messages.create(
        {
          model: MODEL,
          max_tokens: 1500,
          temperature: 0,
          system: SYSTEM_PROMPT,
          tools: [SEARCH_TOOL],
          messages,
        },
        { signal: controller.signal }
      );

      if (response.stop_reason !== "tool_use") {
        const textBlock = response.content.find(
          (block): block is Anthropic.TextBlock => block.type === "text"
        );
        finalText = textBlock?.text ?? null;
        break;
      }

      const toolUseBlock = response.content.find(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
      );

      const assistantContent: Anthropic.ContentBlockParam[] = response.content.map(
        (block) => {
          if (block.type === "tool_use") {
            return {
              type: "tool_use" as const,
              id: block.id,
              name: block.name,
              input: block.input,
            };
          }
          if (block.type === "text") {
            return { type: "text" as const, text: block.text };
          }
          return { type: "text" as const, text: "" };
        }
      );
      messages.push({ role: "assistant", content: assistantContent });

      if (toolUseBlock) {
        toolCalled = true;
        const fixture = getExternalPathology();
        messages.push({
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: toolUseBlock.id,
              content: JSON.stringify(fixture),
            },
          ],
        });
      } else {
        break;
      }
    }

    clearTimeout(timeoutId);

    if (!finalText) {
      return fallbackResponse();
    }

    const parsed = extractJson(finalText);
    if (!parsed) {
      return fallbackResponse();
    }

    return NextResponse.json({
      mode: "live",
      toolCalled,
      result: parsed,
      updatedOverall: "LIKELY_ELIGIBLE",
    });
  } catch {
    return fallbackResponse();
  } finally {
    clearTimeout(timeoutId);
  }
}
