# Health ID

A patient-controlled clinical trial matching demo.

## What it is

Trial matching today moves records to pharma: a patient's full chart gets
shipped somewhere to be checked against eligibility criteria. Health ID
inverts that. Trial criteria come to the patient's **Patient
Graph** — a structured, source-preserving summary of their own facts — and
only the minimum disclosure needed to prove eligibility ever leaves the
patient's control.

The result is a cohort of patient graphs evaluated locally against a
trial's criteria, with every fact traceable back to its original source
(consult note, pathology report, imaging report, ...), and a consent flow
where the patient — not the site, not the sponsor — decides what gets
shared and can revoke it.

## The 5-beat demo

The demo is a sequential experience, not a static dashboard. Each beat is
gated: you cannot advance until the on-screen action has happened. The
single sentence it exists to prove is:

> **The agents found the patient without exposing the patient. Then the
> patient chose what the trial could see.**

Keyboard-controlled: `→` advances (once the current beat is unlocked),
`←` goes back, `r` resets everything (including consent state).

1. **Fragmented data → patient graph** — a patient's facts are scattered
   across a hospital EHR, an external pathology lab, a previous oncology
   clinic, and a patient-uploaded record. `Create private patient graph`
   links them into one source-preserving graph centered on `P-007`.
2. **Private cohort scan** — a trial is imported (12 criteria parsed).
   `Run private patient-graph scan` runs a visible agentic pass (parsing
   criteria, searching graphs, verifying evidence, protecting identity),
   then reveals 2 likely eligible / 3 eligibility unknown / 5 ineligible
   and, prominently, **0 identifiable records disclosed**. Cards are
   clickable with a reason; P-007 is the single highlighted candidate.
3. **The magic moment (UNKNOWN → MATCH)** — P-007 opens on its blocking
   gap, not a table: `ELIGIBILITY BLOCKED · 1 missing fact · HER2-low
   status`. `Find missing evidence` triggers a tool-calling agent that
   searches sources one by one (oncology consult → hospital EHR →
   connected pathology → result found), surfaces the external pathology
   proof, and animates `ELIGIBILITY UNKNOWN → LIKELY ELIGIBLE`. The
   provenance table (criterion ↔ fact ↔ source) sits below as evidence.
4. **Health ID (consent wallet)** — the patient sees exactly what
   the trial may share (age range, diagnosis, HER2 status, prior
   treatment, contact permission) vs. what will *not* be shared (full
   clinical notes, unrelated diagnoses, complete record), then
   `Approve eligibility proof`. Access can be revoked after the fact.
5. **Research site eligibility proof** — the receiving site sees only a
   consented, criteria-level match: 12/12 supported, evidence verified,
   patient approved contact, full record not disclosed, ready for formal
   screening. `Request full record` is explicitly `DISCLOSURE BLOCKED` as
   outside consent scope.

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
  timeout. Beat 3 (the candidate screen) calls this route while its
  source-by-source search animation plays.
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
