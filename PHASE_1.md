# Phase 1: Research Pipeline Implementation

## Overview

This phase implements a **complete vertical slice**: a working research pipeline that reads SaaS applications, researches them using Claude, and produces structured output.

**Goal**: Research one application successfully from end to end.

## New Files

### Input Data

#### `apps/test.json`
**Purpose**: Test dataset containing 3 SaaS applications to research.

**Structure**: Array of AppInput objects
```json
[
  { "name": "Slack", "description": "Team communication..." },
  { "name": "Stripe", "description": "Payment processing..." },
  { "name": "HubSpot", "description": "CRM and marketing..." }
]
```

**Responsibility**: Serves as input to the research pipeline.

**Dependencies**: Read by `src/pipeline/research.ts`

---

### Prompts

#### `src/prompts/research.ts`
**Purpose**: LLM prompt templates for the Research Agent.

**Exports**:
- `getResearchPrompt(app)` - User prompt that tells Claude what to research
- `getResearchSystemPrompt()` - System prompt that sets Claude's behavior

**Key Design**:
- Emphasizes accuracy > speed
- Requires evidence URLs for every claim
- Defaults to "Unknown" rather than guessing
- Outputs strict JSON structure

**Responsibility**: Guides Claude's research behavior toward trustworthy findings.

**Dependencies**: Used by `src/agents/research.ts`

#### `src/prompts/index.ts`
**Purpose**: Module entry point that exports all prompts.

**Responsibility**: Clean import path via `@prompts`.

---

### Agents

#### `src/agents/research.ts`
**Purpose**: Implements the Research Agent using Claude.

**Class**: `ResearchAgent`
- Constructor: Takes env, logger, options
- `research(app)` - Research a single app
- `researchBatch(apps)` - Research multiple apps sequentially
- `performResearch(app)` - Internal method that calls Claude

**Key Features**:
- Validates ANTHROPIC_API_KEY on initialization
- Uses Claude 3.5 Sonnet model
- Automatic retry with exponential backoff (via `retryAsync`)
- Validates output against ResearchFinding Zod schema
- Logs detailed progress for each app
- Continues on errors instead of failing completely

**Responsibility**: Core research logic using Claude LLM.

**Dependencies**:
- Uses: `@anthropic-ai/sdk` (Anthropic API)
- Uses: `@config`, `@models`, `@utils`, `@prompts`
- Used by: `src/pipeline/research.ts`

#### `src/agents/index.ts`
**Purpose**: Module entry point for agents.

**Responsibility**: Clean import path via `@agents`.

---

### Pipeline

#### `src/pipeline/research.ts`
**Purpose**: Orchestrates the complete research flow.

**Flow**:
1. Load environment (validates ANTHROPIC_API_KEY)
2. Create logger
3. Load apps from `apps/test.json`
4. Initialize ResearchAgent
5. Research all apps (logs progress)
6. Validate results against ResearchFindingsSchema
7. Write output to `output/research.json`
8. Report summary (total, successful, failed)

**Key Design**:
- Direct script execution (not exported functions)
- Can be run via `npm run research`
- Logs all steps (info, warn, error)
- Fails fast on critical errors, skips on app-specific errors

**Responsibility**: Orchestrates the entire research stage.

**Dependencies**:
- Uses: `@config`, `@models`, `@utils`, `@agents`
- Run via: `npm run research` script in package.json

#### `src/pipeline/index.ts`
**Purpose**: Module entry point for pipeline stages.

**Responsibility**: Clean import path via `@pipeline`.

---

### Configuration

#### `package.json` (Updated)
**Change**: Added `@anthropic-ai/sdk` to dependencies.

```json
"dependencies": {
  "@anthropic-ai/sdk": "^0.20.0",
  ...
}
```

**Reason**: Needed for Claude API calls.

---

## Data Flow

```
apps/test.json
    ↓
[Load & validate with AppsInputSchema]
    ↓
ResearchAgent.researchBatch()
    ├→ For each app:
    │   ├→ Claude researches app
    │   ├→ Parse JSON response
    │   ├→ Validate against ResearchFindingSchema
    │   └→ Collect findings or skip on error
    ↓
ResearchFindingsSchema.parse()
    ↓
output/research.json
    [Each finding includes all required fields + evidenceUrls]
```

---

## Generated Output Format

### `output/research.json`

**Structure**: Array of ResearchFinding objects

```typescript
{
  "appName": "Slack",
  "category": "Communication",
  "description": "Team messaging and collaboration...",
  "authMethods": ["OAuth2", "API Key"],
  "selfServe": true,
  "apiType": "REST",
  "apiBreadth": "Comprehensive",
  "hasMcp": false,
  "integrationBlocker": null,
  "toolkitReadiness": "Ready",
  "evidenceUrls": [
    {
      "url": "https://api.slack.com/authentication/oauth2",
      "title": "OAuth2 Authentication",
      "claim": "OAuth2 is supported"
    },
    ...
  ],
  "researchNotes": "Optional notes from research",
  "rawResponse": { ... },  // Raw Claude response for audit
  "timestamp": "2025-07-09T..."
}
```

---

## Running the Pipeline

### Prerequisites
1. Set `ANTHROPIC_API_KEY` in `.env`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

### Execute
```bash
npm run research
```

### Output
- Logs to console (pretty-printed in development)
- Writes results to `output/research.json`
- Shows summary: `✅ Research pipeline completed`

---

## Limitations & Known Issues

### 1. **Claude as Source of Truth**
   - Currently relies 100% on Claude's knowledge
   - Claude may hallucinate or be outdated
   - No verification against actual documentation
   - **Fix**: Phase 2 will add Verification Agent

### 2. **No Real Web Scraping Yet**
   - Agent doesn't actually browse official docs
   - Uses Claude's training knowledge only
   - Evidence URLs may be inferred, not verified
   - **Fix**: Phase 2 will integrate Firecrawl for real doc extraction

### 3. **Sequential Processing Only**
   - Apps are researched one at a time
   - No parallel execution
   - Takes ~10-30s per app (Claude response time)
   - **Fix**: Can be added via `parallelWithLimit` utility

### 4. **No Retry on Token Limits**
   - If Claude's response is incomplete, it's not retried
   - `max_tokens=2048` may cut off long responses
   - **Fix**: Can increase max_tokens or add pagination

### 5. **JSON Validation Only**
   - Schema validates output structure
   - Does NOT validate if claims are accurate
   - Only Zod catches malformed JSON
   - **Fix**: Phase 2 Verification Agent will validate claims

### 6. **No Confidence Scoring**
   - All findings get `timestamp` but no confidence
   - No indication of how trustworthy each claim is
   - **Fix**: Phase 3 will add deterministic confidence scorer

### 7. **Test Dataset is Small**
   - Only 3 apps for rapid iteration
   - Real pipeline will handle 100 apps
   - Should still work, but not tested at scale
   - **Fix**: Will increase after this phase works

---

## Architecture Decisions

### Why Separate Agent Class?
```typescript
const agent = new ResearchAgent(env, logger);
const finding = await agent.research(app);
```

- Encapsulates Claude client initialization
- Validates ANTHROPIC_API_KEY once (fail-fast)
- Reusable across multiple pipeline stages
- Easy to mock for testing

### Why ResearchFindingSchema Validation?
```typescript
const validated = ResearchFindingSchema.parse({
  appName: app.name,
  ...parsedResponse,
  rawResponse: parsedResponse,
  timestamp: new Date().toISOString(),
});
```

- Ensures output structure is correct
- Catches JSON parsing errors early
- Preserves raw response for audit trail
- Integrates cleanly with Phase 2

### Why Continue on Error?
```typescript
try {
  const finding = await this.research(app);
  results.push(finding);
} catch (error) {
  logger.error({ appName }, 'Skipping application');
  // Continue to next app
}
```

- One failing app shouldn't break the pipeline
- Partial results are better than no results
- Can retry failed apps separately
- Aligns with production requirements

---

## Validation & Quality

### Type Safety
✅ TypeScript strict mode
✅ All imports use `.js` extensions (ESM)
✅ No `any` types
✅ Path aliases working

### Code Quality
✅ ESLint passes
✅ Prettier formatting applied
✅ No unused variables or imports
✅ Clear error handling

### Zod Validation
✅ Input validated (AppsInputSchema)
✅ Output validated (ResearchFindingSchema)
✅ Raw response preserved for audit
✅ Timestamp automatically added

---

## Integration with Existing Foundation

### Config Module
- `loadEnvironment()` - Loads and validates env vars
- `createLogger()` - Creates Pino logger with correct level
- `CONFIDENCE_THRESHOLDS` - Constants (prepared for Phase 3)

### Models Module
- `AppsInputSchema` - Validates input apps
- `ResearchFindingSchema` - Validates research output
- Type-safe interfaces throughout

### Utils Module
- `readJsonFile<T>()` - Reads with Zod validation
- `writeJsonFile()` - Writes with directory creation
- `retryAsync()` - Automatic retry with backoff
- Custom error types for context

---

## Next Steps (Phase 2)

When approved, Phase 2 will add:

1. **Verification Agent** - Independently validate findings
2. **Firecrawl Integration** - Real documentation extraction
3. **Verification Pipeline** - verification.json output
4. **Confidence Scoring** - Deterministic score calculation

All using the same architectural patterns established here.

---

## Files Summary

| File | Type | Status | Lines |
|------|------|--------|-------|
| `apps/test.json` | Data | ✅ New | 10 |
| `src/prompts/research.ts` | Implementation | ✅ New | 50 |
| `src/prompts/index.ts` | Config | ✅ New | 5 |
| `src/agents/research.ts` | Implementation | ✅ New | 185 |
| `src/agents/index.ts` | Config | ✅ New | 5 |
| `src/pipeline/research.ts` | Implementation | ✅ New | 40 |
| `src/pipeline/index.ts` | Config | ✅ New | 5 |
| `package.json` | Config | ✅ Updated | +1 dependency |
| **Total** | | | ~300 |

---

## Quality Checklist

- ✅ TypeScript strict mode: PASS
- ✅ ESLint: PASS
- ✅ Prettier: PASS
- ✅ Type-check: PASS
- ✅ Build: PASS
- ✅ Zod validation: Implemented
- ✅ Error handling: Implemented
- ✅ Logging: Implemented
- ✅ Configuration: Integrated
- ✅ Documentation: Comprehensive

---

**Ready for Phase 2 approval.**
