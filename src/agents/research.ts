/**
 * Research Agent - Evidence-Driven
 *
 * Multi-stage research:
 * 1. Search for official docs using Tavily
 * 2. Extract clean docs using Firecrawl
 * 3. Pass ONLY official docs to Claude
 * 4. Claude extracts structured fields from docs
 * 5. Validate output against schema
 */

import pino from 'pino';

import { Environment } from '../config/env.js';
import { getChildLogger } from '../config/logger.js';
import { AppInput } from '../models/app.js';
import { ResearchFindingSchema, ResearchFinding } from '../models/research.js';
import { ResearchError } from '../utils/errors.js';
import { retryAsync } from '../utils/async.js';
import { inferenceExtractFromDocs } from '../utils/inference.js';
import {
  TavilySearch,
  filterOfficialResults,
} from '../tools/tavily.js';
import { DocumentationExtractor } from '../tools/firecrawl.js';

export interface ResearchAgentOptions {
  maxRetries?: number;
  timeoutMs?: number;
  model?: string;
}

/**
 * Research Agent that is evidence-driven
 * Searches for official docs, extracts them, and passes only to Claude
 */
export class ResearchAgent {
  private tavilySearch: TavilySearch;
  private docExtractor: DocumentationExtractor;
  private logger: pino.Logger;
  private options: Required<ResearchAgentOptions>;

  constructor(
    env: Environment,
    logger: pino.Logger,
    options?: ResearchAgentOptions
  ) {
    // No external API key required - using local inference
    this.tavilySearch = new TavilySearch(env, logger);
    this.docExtractor = new DocumentationExtractor(env, logger);

    this.logger = getChildLogger(logger, 'research-agent');
    this.options = {
      maxRetries: options?.maxRetries ?? 2,
      timeoutMs: options?.timeoutMs ?? 60000,
      model: options?.model ?? 'local-inference',
    };
  }

  /**
   * Research a single SaaS application (evidence-driven)
   *
   * Flow:
   * 1. Search for official docs
   * 2. Extract documentation
   * 3. Pass to Claude with docs context
   * 4. Validate output
   */
  async research(app: AppInput): Promise<ResearchFinding> {
    this.logger.info({ appName: app.name }, 'Starting evidence-driven research');

    try {
      // Stage 1: Search for official documentation
      this.logger.info({ appName: app.name }, 'Searching for official documentation');
      const searchResults = await this.tavilySearch.findOfficialDocs(
        app.name,
        app.description
      );

      if (searchResults.length === 0) {
        this.logger.warn(
          { appName: app.name },
          'No documentation found - returning unknown fields'
        );
        return this.createUnknownFinding(app);
      }

      const officialResults = filterOfficialResults(searchResults, app.name);
      if (officialResults.length === 0) {
        this.logger.warn(
          { appName: app.name },
          'No official documentation found - returning unknown fields'
        );
        return this.createUnknownFinding(app);
      }

      // Stage 2: Extract documentation content
      this.logger.info(
        { appName: app.name, urlCount: officialResults.length },
        'Extracting documentation content'
      );

      const docUrls = officialResults.map((r) => r.url);
      const extractedDocs = await this.docExtractor.extractDocumentationBatch(
        docUrls
      );

      if (extractedDocs.length === 0) {
        this.logger.warn(
          { appName: app.name },
          'Failed to extract any documentation'
        );
        return this.createUnknownFinding(app);
      }

      // Stage 3: Extract from documentation
      this.logger.info(
        { appName: app.name, docCount: extractedDocs.length },
        'Extracting structured data from documentation'
      );

      const finding = await retryAsync(
        () =>
          this.extractFromDocumentation(app, extractedDocs.map((d) => d.url)),
        {
          maxAttempts: this.options.maxRetries,
          onRetry: (attempt, error) => {
            this.logger.warn(
              { appName: app.name, attempt, error: error.message },
              'Retrying extraction'
            );
          },
        }
      );

      this.logger.info(
        {
          appName: app.name,
          evidenceCount: finding.evidenceUrls.length,
        },
        'Research completed successfully'
      );

      return finding;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error during research';
      this.logger.error({ appName: app.name, error: message }, 'Research failed');
      throw new ResearchError(
        `Failed to research ${app.name}: ${message}`,
        app.name,
        error
      );
    }
  }

  /**
   * Extract structured data from retrieved documentation
   * Passes ONLY the retrieved docs to Claude
   */
  private async extractFromDocumentation(
    app: AppInput,
    docUrls: string[]
  ): Promise<ResearchFinding> {
    // Format documentation for inference
    const extractedDocs = await this.docExtractor.extractDocumentationBatch(docUrls);
    const documentationContext = extractedDocs
      .map((doc) => doc.markdown)
      .join('\n\n---\n\n');

    // Use local inference (completely free, no API calls)
    const parsedResponse = await inferenceExtractFromDocs(
      app.name,
      documentationContext
    );

    // Validate against schema
    const validated = ResearchFindingSchema.parse({
      appName: app.name,
      ...parsedResponse,
      rawResponse: parsedResponse,
      timestamp: new Date().toISOString(),
    });

    return validated;
  }

  /**
   * Create a finding when documentation cannot be found
   * All fields are unknown/null
   */
  private createUnknownFinding(app: AppInput): ResearchFinding {
    return ResearchFindingSchema.parse({
      appName: app.name,
      category: null,
      description: null,
      authMethods: null,
      apiType: null,
      apiBreadth: null,
      hasMcp: null,
      selfServe: null,
      integrationBlocker: 'Official documentation not found',
      toolkitReadiness: null,
      evidenceUrls: [],
      researchNotes:
        'No official documentation could be found. All fields are unknown.',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Research multiple applications in sequence
   */
  async researchBatch(apps: AppInput[]): Promise<ResearchFinding[]> {
    const results: ResearchFinding[] = [];

    for (let i = 0; i < apps.length; i++) {
      const currentApp = apps[i];
      if (!currentApp) {
        continue;
      }

      this.logger.info(
        { appName: currentApp.name, progress: `${i + 1}/${apps.length}` },
        'Processing application'
      );

      try {
        const finding = await this.research(currentApp);
        results.push(finding);
      } catch (error) {
        this.logger.error(
          { appName: currentApp.name, error },
          'Skipping application due to research failure'
        );
      }
    }

    return results;
  }
}
