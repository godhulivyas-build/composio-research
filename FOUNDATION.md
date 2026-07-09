# Project Foundation - Complete File Reference

This document explains every file created for the project foundation, its responsibility, and which future modules depend on it.

---

## Root Configuration Files

### `package.json`
**Purpose**: NPM package manifest with dependencies and scripts.

**Responsibilities**:
- Declares all dependencies (Zod, Pino, dotenv)
- Declares optional dependencies (Playwright, Firecrawl, Tavily)
- Defines npm scripts (build, dev, lint, test, pipeline stages)
- Sets engine requirements (Node 18+, pnpm 8+)

**Depended By**: 
- All modules (via `pnpm install`)
- All npm scripts

---

### `tsconfig.json`
**Purpose**: TypeScript compiler configuration with strict settings.

**Responsibilities**:
- Strict type checking (strict: true)
- Module resolution (ES2022)
- Path aliases (@config, @utils, @models, etc.)
- Source maps and declaration files for debugging

**Depended By**:
- TypeScript compiler (npm run build)
- IDE type checking
- All source files

---

### `.env.example`
**Purpose**: Template for environment variables.

**Responsibilities**:
- Lists all required and optional env vars
- Provides sensible defaults in comments
- Shows proper format for each variable
- No secrets included (all values empty)

**Depended By**:
- Developer setup (copy to .env)
- CI/CD configuration

---

### `.gitignore`
**Purpose**: Excludes files from version control.

**Responsibilities**:
- Ignores node_modules/, dist/, output/
- Ignores .env files (never commit secrets)
- Ignores IDE files (.vscode/, .idea/)
- Ignores build artifacts

**Depended By**:
- Git (prevents accidental commits)

---

### `.eslintrc.json`
**Purpose**: Code quality rules.

**Responsibilities**:
- TypeScript-aware linting
- Requires explicit function return types
- Bans `any` types
- Enforces no unused variables
- Flags floating promises

**Depended By**:
- npm run lint
- IDE plugins

---

### `.prettierrc.json`
**Purpose**: Code formatting rules.

**Responsibilities**:
- 100-character line limit
- 2-space indentation
- Single quotes
- Trailing commas in ES5

**Depended By**:
- npm run format
- IDE plugins

---

## Configuration Module (`src/config/`)

### `src/config/env.ts`
**Purpose**: Environment variable loading and validation.

**Responsibilities**:
- Validates all env vars against Zod schema
- Applies sensible defaults (LOG_LEVEL=info, NODE_ENV=development)
- Provides `validateService()` for fail-fast validation on demand
- Provides `getServiceKey()` for optional integrations

**Pattern**:
```typescript
const env = loadEnvironment();  // Always succeeds (has defaults)
validateService(env, 'TAVILY_API_KEY', 'Tavily Search');  // Fails if missing
```

**Depended By**:
- `src/config/logger.ts` (reads NODE_ENV, LOG_LEVEL)
- All agents (via validateService)
- All tools (via validateService)

---

### `src/config/logger.ts`
**Purpose**: Centralized Pino logger configuration.

**Responsibilities**:
- Creates logger instance with correct level (from env)
- Pretty-prints in development (using pino-pretty)
- JSON output in production (for log aggregation)
- Provides `getChildLogger()` for context-specific loggers

**Depended By**:
- All agents
- All pipeline stages
- All tools

---

### `src/config/constants.ts`
**Purpose**: Application-wide constants and enums.

**Responsibilities**:
- Confidence score thresholds and labels
- SaaS categories enum
- API types enum
- Authentication methods enum
- Review status enum
- Helper function: `getConfidenceLabel(score)`

**Depended By**:
- Zod schemas (models/)
- Verification agent
- Scoring pipeline
- HTML report generator

---

### `src/config/index.ts`
**Purpose**: Config module entry point.

**Responsibilities**:
- Re-exports all config utilities and constants
- Enables clean imports: `import { loadEnvironment, CONFIDENCE_THRESHOLDS } from '@config'`

**Depended By**:
- All modules (primary config import)

---

## Models Module (`src/models/`)

### `src/models/app.ts`
**Purpose**: Input SaaS application schema.

**Responsibilities**:
- Zod schema for single app: `{ name, description? }`
- Zod schema for array of apps
- TypeScript types: `AppInput`, `AppsInput`

**Depended By**:
- Research pipeline (reads apps.json)
- Research agent

---

### `src/models/research.ts`
**Purpose**: Research findings schema.

**Responsibilities**:
- `EvidenceUrlSchema`: { url, title?, claim, retrievedAt? }
- `ResearchFindingSchema`: Complete research output for one app
- Fields: appName, category, description, authMethods, apiType, apiBreadth, hasMcp, selfServe, integrationBlocker, toolkitReadiness, evidenceUrls, timestamp
- TypeScript types: `ResearchFinding`, `ResearchFindings`

**Depended By**:
- Research agent (output validation)
- Verification agent (input validation)
- Verification pipeline

---

### `src/models/verification.ts`
**Purpose**: Verification findings schema.

**Responsibilities**:
- `VerificationResultSchema`: Result for one verified field
- `VerificationFindingSchema`: Complete verification output for one app
- Fields: appName, verificationsPassed, verificationsTotal, passRate, results[], flaggedForReview, reviewReason, timestamp
- TypeScript types: `VerificationFinding`, `VerificationFindings`

**Depended By**:
- Verification agent (output validation)
- Scoring pipeline (input validation)

---

### `src/models/finding.ts`
**Purpose**: Final canonical findings after scoring.

**Responsibilities**:
- `FinalFindingSchema`: Complete record after verification + scoring
- Includes all research fields + confidence data
- Fields: appName, category, description, authMethods, apiType, apiBreadth, hasMcp, selfServe, integrationBlocker, toolkitReadiness, evidenceUrls[], verificationPassRate, confidenceScore, confidenceLabel, scoringBreakdown, manualReviewRequired, reviewStatus, reviewNotes, timestamps
- TypeScript types: `FinalFinding`, `FinalFindings`

**Depended By**:
- Scoring pipeline (output validation)
- Analysis pipeline (input validation)
- HTML report generator

---

### `src/models/analysis.ts`
**Purpose**: Cross-application pattern analysis schema.

**Responsibilities**:
- `AnalysisMetricsSchema`: Overall metrics (total apps, avg confidence, pass rates)
- `DistributionSchema`: Category/auth/API distribution
- `PatternAnalysisSchema`: Complete analysis output
- Fields: metrics, authMethodDistribution, oauthAdoption, apiTypeDistribution, selfServePercentage, mcpReadinessPercentage, toolkitReadinessPercentage, commonBlockers, insights, recommendations
- TypeScript types: `PatternAnalysis`

**Depended By**:
- Analysis pipeline (output validation)
- HTML report generator

---

### `src/models/index.ts`
**Purpose**: Models module entry point.

**Responsibilities**:
- Re-exports all schemas and types
- Enables clean imports: `import { ResearchFinding, FinalFinding } from '@models'`

**Depended By**:
- All modules (primary types/validation import)

---

## Utilities Module (`src/utils/`)

### `src/utils/file.ts`
**Purpose**: File I/O operations with validation.

**Responsibilities**:
- `readJsonFile<T>(path, schema)`: Read JSON with Zod validation
- `writeJsonFile(path, data)`: Write JSON with pretty formatting
- `fileExists(path)`: Check if file exists
- `readTextFile(path)`: Read plain text
- `writeTextFile(path, content)`: Write plain text
- Auto-creates parent directories

**Depended By**:
- Research pipeline (reads apps.json, writes research.json)
- Verification pipeline (reads research.json, writes verification.json)
- Scoring pipeline (reads verification.json, writes final_findings.json)
- Analysis pipeline (reads final_findings.json, writes analysis.json)
- Report pipeline (reads analysis.json, writes HTML)

---

### `src/utils/errors.ts`
**Purpose**: Custom error types and helpers.

**Responsibilities**:
- `ConfigurationError`: Configuration issues
- `ValidationError`: Data validation failures
- `ResearchError`: Research agent failures
- `VerificationError`: Verification agent failures
- `ExternalServiceError`: Tavily, Firecrawl, Anthropic failures
- `getErrorMessage(error)`: Safe error message extraction
- `isRetriableError(error)`: Check if error can be retried

**Depended By**:
- All agents (throw specific errors)
- All tools (throw ExternalServiceError)
- All pipeline stages (handle errors)

---

### `src/utils/async.ts`
**Purpose**: Async utilities and control flow.

**Responsibilities**:
- `retryAsync(fn, options)`: Retry with exponential backoff
- `sleep(ms)`: Delay execution
- `withTimeout(promise, ms)`: Timeout a promise
- `parallelWithLimit(tasks, limit)`: Run tasks with concurrency limit
- `sequential(tasks)`: Run tasks in sequence
- Handles retriable errors intelligently

**Depended By**:
- Research agent (retry searching)
- Verification agent (retry verification)
- All external service integrations (retry on 5xx, 429)

---

### `src/utils/index.ts`
**Purpose**: Utilities module entry point.

**Responsibilities**:
- Re-exports all utilities
- Enables clean imports: `import { readJsonFile, retryAsync } from '@utils'`

**Depended By**:
- All modules (primary utilities import)

---

## Agents Module (`src/agents/`)

### `src/agents/README.md`
**Purpose**: Documentation for agents folder.

**Responsibilities**:
- Explains agent responsibilities
- Shows folder structure
- Lists TODO items for implementation

**Depended By**:
- Developers implementing agents

---

## Tools Module (`src/tools/`)

### `src/tools/README.md`
**Purpose**: Documentation for tools folder.

**Responsibilities**:
- Explains tool responsibilities
- Lists required integrations:
  - Tavily (search)
  - Firecrawl (documentation extraction)
  - Playwright (browser automation)
  - Anthropic (LLM calls)
- Lists TODO items for implementation

**Depended By**:
- Developers implementing tools

---

## Prompts Module (`src/prompts/`)

### `src/prompts/README.md`
**Purpose**: Documentation for prompts folder.

**Responsibilities**:
- Explains prompt architecture
- Lists required prompts:
  - Research prompts
  - Verification prompts
- Shows prompt design pattern (Role, Context, Output Format, Constraints)

**Depended By**:
- Developers implementing agents

---

## Pipeline Module (`src/pipeline/`)

### `src/pipeline/README.md`
**Purpose**: Documentation for pipeline orchestration.

**Responsibilities**:
- Shows complete data flow (apps.json → research.json → ... → HTML)
- Lists required pipeline stages:
  - research.ts
  - verify.ts
  - score.ts
  - analyze.ts
  - report.ts
  - orchestrator.ts
- Explains each stage's responsibility

**Depended By**:
- Developers implementing pipeline stages

---

## Application Entry Point

### `src/index.ts`
**Purpose**: Application entry point.

**Responsibilities**:
- Loads environment
- Creates logger
- Logs startup message
- Placeholder for future orchestration

**Depended By**:
- `npm run dev` command

---

## Top-Level Documentation

### `README.md`
**Purpose**: Project overview and getting started guide.

**Responsibilities**:
- Project vision and design principles
- Tech stack summary
- Full folder structure
- Installation and setup
- Usage (running full pipeline and individual stages)
- Development commands (lint, format, test)
- Data model documentation
- Configuration guide
- Design decision explanations
- Metrics to track
- Future improvements

**Depended By**:
- New developers onboarding
- Project stakeholders

---

### `ARCHITECTURE.md`
**Purpose**: Detailed system design (provided by user).

**Responsibilities**:
- Objective and data model
- Design principles
- High-level pipeline flow
- Agent responsibilities
- Confidence scoring logic
- Folder structure
- Technology stack
- Data flow details
- Human review requirements
- Success metrics

**Depended By**:
- All implementation work
- Design decisions

---

### `FOUNDATION.md` (This File)
**Purpose**: Documentation of the foundation setup.

**Responsibilities**:
- Explains every file's purpose
- Shows dependencies between modules
- Clarifies responsibility boundaries
- Documents the architecture as built

**Depended By**:
- This session's final review
- Future reference

---

## Input/Output Folders

### `apps/README.md`
**Purpose**: Input data folder documentation.

**Responsibilities**:
- Explains apps.json format
- Shows example apps
- Documents how to use

**Depended By**:
- Research pipeline
- Developers preparing input

---

### `output/README.md`
**Purpose**: Generated artifacts documentation.

**Responsibilities**:
- Lists output files (research.json, verification.json, final_findings.json, analysis.json)
- Explains each file's format
- Shows lifecycle (overwritten on each run)

**Depended By**:
- Pipeline stages
- Report generation

---

### `reports/README.md`
**Purpose**: Generated reports documentation.

**Responsibilities**:
- Lists report files (index.html, methodology.html, README.md)
- Describes dashboard features
- Shows how to generate reports

**Depended By**:
- Report generation
- End users

---

### `tests/README.md`
**Purpose**: Testing infrastructure documentation.

**Responsibilities**:
- Shows test folder structure
- Explains testing strategy
- Lists TODO test cases

**Depended By**:
- Developers writing tests

---

## Dependency Graph

```
loadEnvironment() [env.ts]
  ├─→ createLogger() [logger.ts]
  ├─→ validateService() [env.ts]
  └─→ getServiceKey() [env.ts]

Models (Zod schemas) [models/*]
  ├─→ readJsonFile<T>() [file.ts]
  ├─→ writeJsonFile() [file.ts]
  └─→ All pipeline stages

File I/O [file.ts]
  ├─→ readJsonFile() → validation
  ├─→ writeJsonFile() → output
  └─→ All pipeline stages

Error Handling [errors.ts]
  ├─→ All agents
  ├─→ All tools
  └─→ All pipeline stages

Async Control [async.ts]
  ├─→ retryAsync() → External services
  ├─→ parallelWithLimit() → Batch processing
  └─→ All agents

Constants [constants.ts]
  ├─→ Zod schemas
  ├─→ Confidence scoring
  └─→ HTML report generation
```

---

## What's NOT Included (Yet)

The foundation includes NO implementation of:

- Research Agent logic
- Verification Agent logic
- External service integrations (Tavily, Firecrawl, Playwright, Anthropic)
- LLM prompt templates
- Pipeline stage orchestration
- Confidence scoring algorithm
- Pattern analysis logic
- HTML report generation
- Business logic of any kind

These will be implemented in Phase 2, using this foundation as a base.

---

## Key Design Decisions Embedded in Foundation

### 1. Fail-Fast on Missing Config
```typescript
// This succeeds (has defaults):
const env = loadEnvironment();

// This fails if TAVILY_API_KEY is missing (on-demand validation):
validateService(env, 'TAVILY_API_KEY', 'Tavily');
```

**Why**: Allows development without all services configured. Only fails when actually needed.

### 2. Zod for Both Validation & Types
```typescript
const schema = z.object({ name: z.string() });
type Data = z.infer<typeof schema>;

// Runtime validation:
const valid = schema.parse(data);
```

**Why**: Single source of truth for both TypeScript types and runtime validation.

### 3. Logger Context
```typescript
const childLogger = getChildLogger(logger, 'research-agent');
childLogger.info({ appName: 'Stripe' }, 'Starting research');
// Logs with { context: 'research-agent' } automatically
```

**Why**: Makes debugging easier - all logs from a component are tagged.

### 4. Separate Error Types
```typescript
throw new ResearchError('API limit exceeded', appName, { retryAfter: 60 });
throw new ExternalServiceError('Rate limited', 'Tavily', 429);
```

**Why**: Allows code to handle different errors differently (retry vs. skip vs. abort).

### 5. Async Utility Suite
```typescript
await retryAsync(() => fetchDocs(app), { maxAttempts: 3, backoffMultiplier: 2 });
const results = await parallelWithLimit(tasks, 3);  // Max 3 concurrent
```

**Why**: Standardized async patterns prevent bugs and make code readable.

---

## Ready for Phase 2

This foundation is production-ready:

✅ All configuration concerns isolated to `src/config/`
✅ All data models validated with Zod in `src/models/`
✅ All utilities shared in `src/utils/`
✅ All external tools have a home in `src/tools/`
✅ Clear folder structure matching ARCHITECTURE.md
✅ TypeScript strict mode enforced
✅ ESLint and Prettier configured
✅ npm scripts ready for each pipeline stage
✅ Comprehensive documentation for every file
✅ Entry point ready for orchestration

**Next Steps**:
1. User review of foundation
2. Approval to proceed to Phase 2
3. Implement agents, tools, and pipeline stages
