# Composio Agent Research Pipeline Architecture

## Objective

Build a trustworthy AI research pipeline that researches 100 SaaS
applications and produces structured, evidence-backed findings suitable
for AI toolkit integration analysis.

Each application should capture:

-   Category
-   One-line description
-   Authentication methods
-   Self-serve vs. gated access
-   API surface (REST / GraphQL / Other)
-   Approximate API breadth
-   MCP availability
-   Agent toolkit readiness
-   Primary integration blocker
-   Evidence URLs
-   Confidence score

------------------------------------------------------------------------

# Design Principles

-   Accuracy over automation
-   Evidence over assumptions
-   Unknown is better than hallucinated
-   Every claim must have evidence
-   Modular agents with single responsibility
-   Human review for ambiguous cases
-   Reproducible pipeline
-   Scalable architecture

------------------------------------------------------------------------

# High-Level Pipeline

    Input Apps
        │
        ▼
    Research Agent
        │
        ▼
    Verification Agent
        │
        ▼
    Deterministic Confidence Scoring
        │
        ▼
    Pattern Analysis
        │
        ▼
    HTML Dashboard
        │
        ▼
    README Generation

------------------------------------------------------------------------

# Agent Responsibilities

## 1. Research Agent

Responsibilities

-   Locate official documentation
-   Find authentication documentation
-   Find API reference
-   Detect MCP support
-   Extract structured fields
-   Attach evidence URLs

Input

-   apps.json

Output

-   research.json

------------------------------------------------------------------------

## 2. Verification Agent

Responsibilities

-   Independently verify extracted fields
-   Validate evidence
-   Compare findings
-   Flag conflicts
-   Mark records for manual review

Output

-   verification.json

------------------------------------------------------------------------

## 3. Confidence Scoring

This is deterministic logic, not an AI agent.

Confidence depends on:

-   Official documentation
-   Verification agreement
-   Evidence quality
-   Completeness

Example:

-   95--100 → Fully verified
-   85--94 → Official docs only
-   70--84 → Mostly verified
-   50--69 → Partial evidence
-   Below 50 → Weak evidence

------------------------------------------------------------------------

## 4. Pattern Analysis

Generate insights across all applications.

Examples:

-   OAuth adoption
-   API availability
-   Self-serve vs gated
-   MCP adoption
-   Integration readiness
-   Category-wise trends
-   Common blockers

Output

analysis.json

------------------------------------------------------------------------

## 5. Report Generator

Produces:

-   Standalone HTML dashboard
-   Charts
-   Summary metrics
-   Searchable table
-   Methodology
-   Limitations

------------------------------------------------------------------------

# Folder Structure

``` text
composio-agent-research/
│
├── ARCHITECTURE.md
├── README.md
├── package.json
├── apps/
├── src/
│   ├── agents/
│   ├── models/
│   ├── pipeline/
│   ├── prompts/
│   ├── tools/
│   ├── utils/
│   └── config/
├── output/
├── reports/
└── tests/
```

------------------------------------------------------------------------

# Technology Stack

  Component                  Choice
  -------------------------- --------------
  Language                   TypeScript
  Runtime                    Node.js
  Package Manager            pnpm
  Validation                 Zod
  Search                     Tavily
  Documentation Extraction   Firecrawl
  Browser Automation         Playwright
  Logging                    Pino
  Environment                dotenv
  Charts                     Chart.js
  Styling                    Tailwind CDN

------------------------------------------------------------------------

# Data Flow

apps.json

↓

Research Agent

↓

research.json

↓

Verification Agent

↓

verification.json

↓

Confidence Scorer

↓

final_findings.json

↓

Pattern Analysis

↓

analysis.json

↓

HTML Dashboard

------------------------------------------------------------------------

# Human Review

Manual review is required when:

-   Evidence conflicts
-   Documentation is unavailable
-   Confidence is below threshold
-   Verification fails

------------------------------------------------------------------------

# Success Metrics

-   Verification pass rate
-   Average confidence score
-   Apps researched
-   Apps requiring manual review
-   OAuth distribution
-   REST vs GraphQL
-   MCP-ready applications
-   Toolkit-ready applications
-   Common blockers

------------------------------------------------------------------------

# Future Improvements

-   Parallel execution
-   Incremental updates
-   Cached documentation
-   Multi-provider LLM support
-   Distributed execution
-   Continuous monitoring

------------------------------------------------------------------------

# Interview Talking Points

-   Why deterministic confidence scoring?
-   Why modular agents?
-   Why evidence-backed extraction?
-   Why human review?
-   How does this scale?
-   Why TypeScript?
-   How does verification improve trust?

This document serves as the implementation blueprint for the project.
