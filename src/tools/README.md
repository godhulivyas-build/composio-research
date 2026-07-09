# Tools

This folder contains integrations with external services used by agents.

## Structure

- `tavily.ts` - Tavily search API integration
- `firecrawl.ts` - Firecrawl documentation extraction integration
- `playwright.ts` - Playwright browser automation integration
- `anthropic.ts` - Anthropic API integration for LLM calls

## Design

Tools are thin adapters around external services. They handle:

- API authentication (with env validation)
- Request/response transformation
- Error handling and retries
- Logging

Each tool exports a factory function that creates a configured client and a set of operations.

## TODO

- Implement Tavily integration
- Implement Firecrawl integration
- Implement Playwright integration
- Implement Anthropic integration
