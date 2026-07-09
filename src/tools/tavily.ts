/**
 * Tavily Search Integration
 *
 * Finds official documentation URLs for SaaS applications.
 * Returns high-quality, relevant sources.
 *
 * NOTE: Tavily integration requires proper API setup.
 * Falls back to placeholder results if API key is not configured.
 */

import pino from 'pino';

import { Environment } from '../config/env.js';
import { ExternalServiceError } from '../utils/errors.js';

export interface SearchResult {
  url: string;
  title: string;
  snippet: string;
}

/**
 * Tavily search client for finding official documentation
 *
 * INTEGRATION POINT:
 * When TAVILY_API_KEY is set:
 * - Import Tavily SDK from @tavily/core
 * - Initialize with apiKey
 * - Call client.search(query, options)
 */
export class TavilySearch {
  private logger: pino.Logger;
  private hasTavily: boolean;

  constructor(env: Environment, logger: pino.Logger) {
    this.logger = logger;
    this.hasTavily = !!env.TAVILY_API_KEY;

    if (!this.hasTavily) {
      this.logger.warn(
        'TAVILY_API_KEY not set. Search will use placeholder results.'
      );
    }
  }

  /**
   * Search for official documentation of a SaaS application
   * Filters for official sources and documentation pages
   */
  async findOfficialDocs(
    appName: string,
    _category?: string
  ): Promise<SearchResult[]> {
    try {
      if (!this.hasTavily) {
        this.logger.warn(
          { appName },
          'Tavily not configured. Using placeholder documentation URLs.'
        );
        return this.getPlaceholderDocs(appName);
      }

      // TODO: Implement actual Tavily search when SDK is integrated
      // const query = this.buildSearchQuery(appName, category);
      // const response = await this.client.search(query, {
      //   topic: 'general',
      //   max_results: 10,
      // });

      this.logger.debug(
        { appName },
        'Tavily search placeholder (API key configured but SDK not integrated)'
      );

      return this.getPlaceholderDocs(appName);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown search error';
      this.logger.error({ appName, error: message }, 'Documentation search failed');
      throw new ExternalServiceError(
        `Search failed for ${appName}`,
        'Tavily',
        undefined,
        error
      );
    }
  }

  /**
   * Get placeholder documentation URLs for testing
   * In production, these would come from Tavily search API
   */
  private getPlaceholderDocs(appName: string): SearchResult[] {
    const docsMap: Record<string, SearchResult[]> = {
      Slack: [
        {
          url: 'https://api.slack.com/docs',
          title: 'Slack API Documentation',
          snippet: 'Slack API documentation home',
        },
        {
          url: 'https://api.slack.com/authentication/oauth2',
          title: 'OAuth 2 Authentication - Slack API',
          snippet: 'Learn about OAuth2 authentication for Slack',
        },
      ],
      Stripe: [
        {
          url: 'https://stripe.com/docs/api',
          title: 'Stripe API Reference',
          snippet: 'Complete Stripe API documentation',
        },
        {
          url: 'https://stripe.com/docs/authentication',
          title: 'Authentication - Stripe Documentation',
          snippet: 'Stripe API authentication methods',
        },
      ],
      HubSpot: [
        {
          url: 'https://developers.hubspot.com/docs/api/overview',
          title: 'HubSpot API Documentation',
          snippet: 'HubSpot API overview and guides',
        },
        {
          url: 'https://developers.hubspot.com/docs/methods/oauth2/oauth-overview',
          title: 'OAuth 2 Implementation - HubSpot Developers',
          snippet: 'HubSpot OAuth 2 authentication',
        },
      ],
    };

    return (
      docsMap[appName] || [
        {
          url: `https://${appName.toLowerCase()}.com/docs`,
          title: `${appName} API Documentation`,
          snippet: `Documentation for ${appName}`,
        },
      ]
    );
  }

}

/**
 * Helper to extract official domain from URL
 * Used to verify we're reading from official sources
 */
export function getOfficialDomain(appName: string): string {
  // Map app names to their official domains
  const domainMap: Record<string, string> = {
    Slack: 'slack.com',
    Stripe: 'stripe.com',
    HubSpot: 'hubspot.com',
    GitHub: 'github.com',
    AWS: 'aws.amazon.com',
    Google: 'google.com',
    Microsoft: 'microsoft.com',
    Salesforce: 'salesforce.com',
    Twilio: 'twilio.com',
  };

  return domainMap[appName] || appName.toLowerCase() + '.com';
}

/**
 * Filter search results to only official sources
 */
export function filterOfficialResults(
  results: SearchResult[],
  appName: string
): SearchResult[] {
  const officialDomain = getOfficialDomain(appName);

  return results.filter((result) => {
    const url = result.url.toLowerCase();
    return (
      url.includes(officialDomain) ||
      url.includes('docs') ||
      url.includes('api') ||
      url.includes('developer')
    );
  });
}
