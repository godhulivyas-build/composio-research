# Prompts

This folder contains LLM prompt templates for agents.

## Structure

- `research.ts` - Prompts for the Research Agent
- `verification.ts` - Prompts for the Verification Agent

## Design

Prompts are functions that take context variables and return formatted prompt strings. They are:

- Deterministic (same input = same output)
- Reusable across agent instances
- Versioned separately from code
- Documented with examples

## Prompt Architecture

Each prompt follows:

1. **Role**: Clear description of the agent's task
2. **Context**: Relevant information (app details, previous findings)
3. **Output Format**: Explicit JSON structure with Zod schema
4. **Constraints**: What to prioritize (accuracy > speed, evidence > assumptions)

## TODO

- Define research prompts
- Define verification prompts
- Add prompt examples and test cases
