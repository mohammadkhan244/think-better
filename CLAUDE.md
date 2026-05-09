# Claude Code Instructions — Reasoning Machine

## MANDATORY FIRST STEP

Before making ANY change to this codebase, read:
  REASONING_MACHINE_CONTRACT.md

This is the system contract. It defines what the 
Reasoning Machine is, what it is not, and what can 
never change.

## BEFORE EVERY CHANGE, VERIFY:

1. Does this change preserve deterministic scoring?
   Pipeline 1 (FLOATER + Signal detection) must 
   never use an LLM. Same input must always produce 
   identical scores.

2. Does this change preserve truth neutrality?
   The system must never declare a claim true or false.

3. Does this change respect pipeline separation?
   Pipeline 2 (LLM) must never influence Pipeline 1 scores.

4. Does this change preserve the language principle?
   No accusatory language. No grading language. 
   Users must feel they discovered something, 
   not that they were evaluated.

5. Does this change map to one of the five primitives?
   Input | Signal | Dimension | Narrative | Question
   If it cannot be mapped, it does not belong here.

## WHAT CAN NEVER BE CHANGED

- FLOATER scoring must remain regex/NLP only (no LLM)
- Signal detection must remain regex/NLP only (no LLM)  
- Same input must always produce identical scores
- The tool must never declare truth or falsehood
- Questions must always be topic-specific, never generic
- Training must never score or evaluate the user
- Pipeline 2 must never influence Pipeline 1 outputs
- The Default Narrative must name cultural stories, 
  not individual beliefs

## ARCHITECTURE REFERENCE

Pipeline 1 (deterministic):
  lib/floater.ts        — FLOATER dimension scoring
  lib/detectors.ts      — bias and fallacy detection
  lib/textUtils.ts      — NLP helpers
  lib/cache.ts          — SHA-256 caching

Pipeline 2 (generative — runs in parallel):
  lib/beliefSystem.ts   — belief system extraction
  lib/defaultNarrative.ts — cultural narrative extraction
  lib/agency.ts         — agency block generation
  lib/questions.ts      — Socratic question generation
  lib/resources.ts      — Go Deeper book recommendations
  lib/training.ts       — training scenario generation
  lib/domainDetector.ts — domain classification

API routes:
  app/api/analyze/route.ts    — main analysis endpoint
  app/api/debug/route.ts      — detector testing
  app/api/stats/route.ts      — assumptions counter
  app/api/training/           — training scenario routes

## WHEN IN DOUBT

Read the contract first.
If a proposed change violates any invariant in 
Section 8 of the contract, do not implement it.
Report the conflict instead.
