# Output

Generated pipeline artifacts.

## Files

- `research.json` - Raw research findings from Research Agent
- `verification.json` - Verification results from Verification Agent
- `final_findings.json` - Final scored and verified findings
- `analysis.json` - Cross-application pattern analysis

## Format

Each file is validated against a Zod schema for type safety and consistency.

## Lifecycle

Files are overwritten on each pipeline run. For archival, copy outputs to `reports/` folder.
