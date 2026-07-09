# Agents

This folder contains the AI agents for the research pipeline.

## Structure

- `research.ts` - Research Agent (locates documentation, extracts structured fields)
- `verification.ts` - Verification Agent (independently validates findings)
- `types.ts` - Shared types and interfaces for agents

## Design

Each agent is responsible for a single stage of the pipeline:

1. **Research Agent**: Given an app name, finds official documentation, extracts structured fields, and attaches evidence URLs.
2. **Verification Agent**: Given research findings, independently validates claims and flags conflicts.

Both agents use LLM tools (via Anthropic API) but are deterministic in their outputs through Zod validation.

## TODO

- Implement research agent logic
- Implement verification agent logic
- Add agent orchestration
