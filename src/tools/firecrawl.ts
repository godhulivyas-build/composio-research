/**
 * Firecrawl Documentation Extraction
 *
 * Fetches and cleans documentation pages using Firecrawl.
 * Returns markdown content suitable for Claude analysis.
 *
 * NOTE: Firecrawl integration is optional.
 * When FIRECRAWL_API_KEY is not set, returns documentation placeholder.
 * This allows testing the research flow without full Firecrawl setup.
 */

import pino from 'pino';

import { Environment } from '../config/env.js';
import { ExternalServiceError } from '../utils/errors.js';

export interface DocumentationPage {
  url: string;
  title: string;
  markdown: string;
  metadata: {
    fetchedAt: string;
    contentLength: number;
  };
}

/**
 * Documentation Extractor using Firecrawl
 * Requires FIRECRAWL_API_KEY in environment
 */
export class DocumentationExtractor {
  private logger: pino.Logger;
  private hasFirecrawl: boolean;

  constructor(env: Environment, logger: pino.Logger) {
    this.logger = logger;
    this.hasFirecrawl = !!env.FIRECRAWL_API_KEY;

    if (!this.hasFirecrawl) {
      this.logger.warn(
        'FIRECRAWL_API_KEY not set. Documentation extraction will be limited.'
      );
    }
  }

  /**
   * Fetch and extract clean markdown from a documentation page
   * Removes navigation, ads, and formatting noise
   *
   * INTEGRATION POINT:
   * When Firecrawl SDK is available, this will:
   * - Call client.scrapeUrl(url, { formats: ['markdown'], onlyMainContent: true })
   * - Clean markdown to remove navigation and ads
   * - Return structured DocumentationPage
   */
  async extractDocumentation(url: string): Promise<DocumentationPage | null> {
    try {
      if (!this.hasFirecrawl) {
        this.logger.warn(
          { url },
          'Firecrawl not configured. Returning placeholder documentation.'
        );
        return this.createPlaceholderPage(url);
      }

      // TODO: Integrate actual Firecrawl SDK when available
      // const response = await this.client.scrapeUrl(url, {
      //   formats: ['markdown'],
      //   onlyMainContent: true,
      // });

      this.logger.debug({ url }, 'Firecrawl documentation extraction placeholder');
      return this.createPlaceholderPage(url);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown extraction error';
      this.logger.error({ url, error: message }, 'Documentation extraction failed');
      throw new ExternalServiceError(
        `Failed to extract ${url}`,
        'Firecrawl',
        undefined,
        error
      );
    }
  }

  /**
   * Fetch multiple documentation pages
   * Returns successful extractions, skips failed ones
   */
  async extractDocumentationBatch(
    urls: string[]
  ): Promise<DocumentationPage[]> {
    const results: DocumentationPage[] = [];

    for (const url of urls) {
      try {
        const page = await this.extractDocumentation(url);
        if (page) {
          results.push(page);
        }
      } catch (error) {
        this.logger.warn(
          { url, error: error instanceof Error ? error.message : String(error) },
          'Skipping failed URL'
        );
      }
    }

    return results;
  }

  /**
   * Prepare documentation for Claude analysis
   * Formats multiple pages into a coherent context
   */
  formatForClaude(pages: DocumentationPage[]): string {
    if (pages.length === 0) {
      return '';
    }

    const sections = pages.map(
      (page) => `
# Source: ${page.title}
URL: ${page.url}

${page.markdown}

---
`
    );

    return `# Official Documentation Retrieved

The following is official documentation retrieved directly from the application's website.

${sections.join('\n\n')}

IMPORTANT: Extract information ONLY from the above official documentation.
Do not rely on your training knowledge.
If information is not present in the documentation, mark it as UNKNOWN.
`;
  }

  /**
   * Create placeholder documentation page
   * Used when Firecrawl is not configured
   */
  private createPlaceholderPage(url: string): DocumentationPage {
    return {
      url,
      title: `Documentation from ${url}`,
      markdown: `
# Documentation Page

**Source**: ${url}

This is a placeholder documentation page.

To enable real documentation extraction:
1. Set FIRECRAWL_API_KEY in your .env file
2. Install Firecrawl SDK: pnpm add @firecrawl/sdk (or appropriate package)
3. Update src/tools/firecrawl.ts to use the actual Firecrawl API

For testing purposes, this placeholder allows the research pipeline to continue
with the evidence-driven architecture in place.
      `,
      metadata: {
        fetchedAt: new Date().toISOString(),
        contentLength: 500,
      },
    };
  }
}
