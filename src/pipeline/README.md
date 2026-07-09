# Pipeline

This folder contains the orchestration logic that connects agents and processing stages.

## Structure

- `research.ts` - Research pipeline (runs Research Agent on apps.json)
- `verify.ts` - Verification pipeline (runs Verification Agent on research.json)
- `score.ts` - Confidence scoring pipeline (deterministic logic)
- `analyze.ts` - Pattern analysis pipeline (cross-app insights)
- `report.ts` - Report generation pipeline (HTML dashboard)
- `orchestrator.ts` - Central pipeline orchestration (runs all stages)

## Data Flow

```
apps.json
  ↓
research.ts → research.json
  ↓
verify.ts → verification.json
  ↓
score.ts → final_findings.json
  ↓
analyze.ts → analysis.json
  ↓
report.ts → output.html
```

## Design

Each pipeline stage:

1. Loads input data
2. Validates with Zod
3. Processes with agents/logic
4. Writes output
5. Handles errors and logging

Stages are independent and can be run separately.

## TODO

- Implement research pipeline
- Implement verification pipeline
- Implement scoring pipeline
- Implement analysis pipeline
- Implement report generation
- Implement orchestrator
