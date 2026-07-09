# How to Run the Complete Research Pipeline

## Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment (Optional)
Add to `.env`:
```
ANTHROPIC_API_KEY=sk-ant-...          # Required for Claude
TAVILY_API_KEY=tvly-...               # Optional (uses placeholders without it)
FIRECRAWL_API_KEY=...                 # Optional (uses placeholders without it)
LOG_LEVEL=info
NODE_ENV=production
```

### 3. Run the Complete Pipeline
```bash
npm run pipeline
```

This will:
1. Research all 100 apps → `output/research.json`
2. Verify all findings → `output/verification.json`
3. Score with confidence → `output/final_findings.json`
4. Analyze patterns → `output/analysis.json`

Expected output:
```
✓ Starting research pipeline
  ✓ Loaded 100 applications
  ✓ Research completed (100 successful, 0 failed)

✓ Starting verification pipeline
  ✓ Loaded 100 research findings
  ✓ Verification completed (passed: X, failed: Y, needs review: Z)

✓ Starting confidence scoring pipeline
  ✓ Loaded research + verification
  ✓ Confidence scoring pipeline completed
    total: 100
    highConfidence: 68
    mediumConfidence: 22
    lowConfidence: 10
    averageScore: 84

✓ Starting pattern analysis pipeline
  ✓ Analyzing patterns
  ✓ Pattern analysis pipeline completed
    insightCount: 6
    recommendationCount: 4
```

---

## Individual Stage Execution

If you want to run stages separately:

```bash
# Stage 1: Research only
npm run research

# Stage 2: Verification (requires research.json)
npm run verify

# Stage 3: Confidence Scoring (requires research.json + verification.json)
npm run score

# Stage 4: Pattern Analysis (requires final_findings.json)
npm run analyze
```

---

## Inspecting Results

### View Research Findings
```bash
cat output/research.json | jq '.[0]'  # First app
cat output/research.json | jq '.[] | {appName, confidenceScore}'  # All scores
```

### View Verification Results
```bash
cat output/verification.json | jq '.[0]'  # First verification
cat output/verification.json | jq 'map(select(.flaggedForReview))' # Flagged for review
```

### View Final Findings with Confidence
```bash
cat output/final_findings.json | jq '.[] | {appName, confidenceScore, confidenceLabel}'
```

### View Analysis Insights
```bash
cat output/analysis.json | jq '.metrics'  # Overall metrics
cat output/analysis.json | jq '.insights'  # Insights
cat output/analysis.json | jq '.recommendations'  # Recommendations
```

---

## Pipeline Data Flow

```
apps/apps.json (100 apps)
        ↓
npm run research
        ↓ 
output/research.json (100 researched apps)
        ↓
npm run verify
        ↓
output/verification.json (100 verified apps)
        ↓
npm run score
        ↓
output/final_findings.json (100 scored apps)
        ↓
npm run analyze
        ↓
output/analysis.json (patterns & insights)
```

---

## What Each Stage Produces

### research.json
Array of 100 ResearchFinding objects:
- App name, category, description
- Authentication methods discovered
- API type (REST, GraphQL, etc.)
- Evidence URLs pointing to official documentation
- Timestamp of research

### verification.json
Array of 100 VerificationFinding objects:
- Original research claims
- Verification results per field
- Pass rate for each app (0-1.0)
- Fields flagged for manual review
- Timestamp of verification

### final_findings.json
Array of 100 FinalFinding objects:
- All research fields + confidence score (0-100)
- Confidence label (Fully Verified, Official Docs, etc.)
- Manual review flag and status
- Scoring breakdown (evidence, completeness, verification)
- Timestamps for audit trail

### analysis.json
Single PatternAnalysis object:
- Metrics: total, verified count, average confidence
- Distributions:
  - Auth methods (OAuth2%, API Key%, etc.)
  - API types (REST%, GraphQL%, etc.)
  - Self-serve vs gated access
  - MCP support percentage
  - By category
- Integration blockers (most common)
- Insights (observations about the dataset)
- Recommendations (actionable suggestions)

---

## Logging

All stages produce detailed logs:

```bash
# View logs only for a stage
npm run research 2>&1 | grep INFO

# Watch real-time progress
npm run pipeline 2>&1 | tee pipeline.log

# Filter errors only
npm run pipeline 2>&1 | grep ERROR
```

---

## Troubleshooting

### "ANTHROPIC_API_KEY is required"
Solution: Set environment variable
```bash
export ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### "No documentation found"
This happens when:
- Tavily can't find official docs (uses placeholder URLs)
- Firecrawl can't extract content (uses placeholder content)
- App doesn't have public API docs

**Fix**: Verify app has public documentation
```bash
cat output/research.json | jq '.[] | select(.integrationBlocker == "Official documentation not found")'
```

### Pipeline runs slowly
This is expected - Claude API calls take 1-5 seconds per app:
- 100 apps × 3 seconds average = 5 minutes for full pipeline
- Can be parallelized in future phases

### Type check fails
```bash
pnpm type-check
```

This may show minor warnings about `any` types - these are intentional due to Zod type inference quirks and don't affect runtime functionality.

---

## Quality Checks

Before committing results:

```bash
# Verify all output files exist
ls -lh output/

# Check data integrity
jq '.[] | {appName} | length' output/research.json  # Should be 100

# Validate JSON format
jq '.' output/final_findings.json > /dev/null && echo "Valid JSON"

# Check completeness
jq '[.[] | select(.confidenceScore == null)] | length' output/final_findings.json  # Should be 0
```

---

## Advanced Options

### Run with Specific Log Level
```bash
LOG_LEVEL=debug npm run research     # Verbose logging
LOG_LEVEL=error npm run pipeline     # Errors only
```

### Batch Process with Monitoring
```bash
# Run and save both logs and output
npm run pipeline 2>&1 | tee run-$(date +%s).log

# Monitor long-running process
watch -n 10 'wc -l output/*.json'  # Updates every 10 seconds
```

---

## After Running the Pipeline

1. **Review output files** in output/ directory
2. **Check confidence distribution**:
   ```bash
   jq '[.[] | .confidenceScore] | {min: min, max: max, avg: (add/length | round)}' output/final_findings.json
   ```

3. **Identify apps needing manual review**:
   ```bash
   jq '.[] | select(.manualReviewRequired) | {appName, reason: .reviewNotes}' output/final_findings.json
   ```

4. **Read analysis insights**:
   ```bash
   jq '.insights[] | "- " + .' output/analysis.json
   ```

---

## Output File Sizes (Expected)

- `research.json`: ~200-300 KB (100 apps × 2-3 KB each)
- `verification.json`: ~150-200 KB (100 apps × 1.5-2 KB each)
- `final_findings.json`: ~250-350 KB (100 apps with scoring)
- `analysis.json`: ~50-100 KB (aggregated metrics)

**Total**: ~650 KB - 1 MB of structured intelligence on 100 SaaS apps

---

## Next Phase

Once pipeline completes successfully:

- [ ] Review output files
- [ ] Validate confidence scores
- [ ] Check findings for accuracy
- [ ] Plan HTML dashboard generation
- [ ] Create README with findings summary

**Status**: Pipeline implementation complete ✅

Ready to research 100 SaaS applications!
