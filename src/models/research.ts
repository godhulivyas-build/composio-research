import { z } from 'zod';
import {
  APP_CATEGORIES,
  API_TYPES,
  AUTH_METHODS,
} from '../config/constants.js';

/**
 * Evidence URL with source and claim it supports.
 */
export const EvidenceUrlSchema = z.object({
  url: z.string().url('Invalid URL'),
  title: z.string().optional(),
  claim: z.string().min(1, 'Claim is required'),
  retrievedAt: z.string().datetime().optional(),
});

export type EvidenceUrl = z.infer<typeof EvidenceUrlSchema>;

/**
 * Core research findings for a single SaaS application.
 * Output from Research Agent.
 */
export const ResearchFindingSchema = z.object({
  appName: z.string().min(1),
  category: z
    .enum(APP_CATEGORIES as unknown as [string, ...string[]])
    .optional(),
  description: z.string().optional(),
  authMethods: z
    .array(z.enum(AUTH_METHODS as unknown as [string, ...string[]]))
    .optional(),
  apiType: z.enum(API_TYPES as unknown as [string, ...string[]]).optional(),
  apiBreadth: z
    .string()
    .optional()
    .describe('Approximate API surface breadth: Limited, Moderate, Comprehensive'),
  hasMcp: z
    .boolean()
    .optional()
    .describe('MCP (Model Context Protocol) support available'),
  selfServe: z
    .boolean()
    .optional()
    .describe('Self-serve signup without gating'),
  integrationBlocker: z
    .string()
    .optional()
    .describe('Primary technical blocker for integration'),
  toolkitReadiness: z
    .string()
    .optional()
    .describe('Ready, Partial, Limited, or Not Ready'),
  evidenceUrls: z
    .array(EvidenceUrlSchema)
    .default([]),
  researchNotes: z.string().optional(),
  rawResponse: z.record(z.unknown()).optional().describe('Raw LLM response for audit'),
  timestamp: z.string().datetime().default(() => new Date().toISOString()),
});

export type ResearchFinding = z.infer<typeof ResearchFindingSchema>;

/**
 * Collection of research findings.
 */
export const ResearchFindingsSchema = z.array(ResearchFindingSchema);
export type ResearchFindings = z.infer<typeof ResearchFindingsSchema>;
