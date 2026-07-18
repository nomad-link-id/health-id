# Research Passport

A patient-controlled clinical trial matching demo.

## What it is

Trial matching today moves records to pharma: a patient's full chart gets
shipped somewhere to be checked against eligibility criteria. Research
Passport inverts that. Trial criteria come to the patient's **Patient
Graph** — a structured, source-preserving summary of their own facts — and
only the minimum disclosure needed to prove eligibility ever leaves the
patient's control.

The result is a cohort of patient graphs evaluated locally against a
trial's criteria, with every fact traceable back to its original source
(consult note, pathology report, imaging report, ...), and a consent flow
where the patient — not the site, not the sponsor — decides what gets
shared and can revoke it.

## The 5-beat demo

Keyboard-controlled: `→` advances, `←` goes back, `r` resets everything
(including consent state).

1. **Cohort** — a trial is imported (12 eligibility criteria parsed) and
   10 synthetic patient graphs are evaluated: likely eligible / eligibility
   unknown / ineligible, with zero identifiable records disclosed.
2. **Candidate** — drills into Patient P-007's 6 decisive criteria,
   showing trial criterion ↔ patient graph fact ↔ original source for
   each. One criterion (HER2 status) is an open gap: no result on file.
3. **Gap resolution** — a tool-calling agent decides whether to search
   external records to close the HER2 gap, retrieves the missing
   pathology result, and re-evaluates the criterion live.
4. **Consent** — the patient sees exactly what's requested (age range,
   diagnosis, HER2 status, treatment lines) vs. what's withheld (full
   chart, unrelated diagnoses), and can share an eligibility proof or
   revoke it after the fact.
5. **Site view** — the receiving research site sees only a consented,
   criteria-level match: no chart, just "supported" on each decisive
   criterion, ready for formal screening. Requesting the full record is
   explicitly blocked as outside consent scope.

## Architecture

- **Next.js (App Router)** — everything is client-rendered beats driven by
  one state machine in `app/page.tsx`; screens live in `components/`.
- **Local fixtures as the source of truth** — `data/` holds the trial
  definition, ten synthetic patient graphs, cohort evaluation results, and
  the external pathology fixture used to close the HER2 gap. `lib/data.ts`
  exposes typed loaders over these fixtures; `lib/types.ts` defines the
  shared domain types (`Fact`, `PatientGraph`, `Trial`, `CriterionResult`,
  ...).
- **Anthropic SDK, manual tool-use loop** — `app/api/resolve-gap/route.ts`
  runs a real agent (`@anthropic-ai/sdk`) with one tool,
  `search_external_records`. It decides whether to call it, receives the
  fixture back as a tool result, and re-evaluates the HER2 criterion,
  replying in strict JSON. The loop is capped at 3 turns with a 25s
  timeout.
- **Fallback-protected** — if the API key is missing, the call errors,
  times out, or the model's reply doesn't parse as JSON, the route falls
  back to a pre-resolved fixture (`data/resolved-p007.json`) so the demo
  always completes the beat. The UI never surfaces the failure; only
  `console.log(mode)` distinguishes a live resolution from a fallback one.

## Running it

```bash
npm i
```

Add your Anthropic API key to `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

(Beat 3 works without a key too — it just always takes the fallback
path instead of calling the model live.)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and use the arrow
keys to drive the demo.

## Synthetic data

Every patient, fact, source, and pathology result in this project is
synthetic. Nothing here reflects a real person, a real trial, or a real
clinical record, and none of it should be used for actual treatment or
coverage decisions.
