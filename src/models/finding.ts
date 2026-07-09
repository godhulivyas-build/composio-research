import { z } from 'zod';
import { REVIEW_STATUS } from '../config/constants.js';

/**
 * Final findings after all verification and scoring.
 * This is the canonical record for each SaaS application.
 */
export const FinalFindingSchema = z.object({
  appName: z.string().min(1),
  category: z.string().optional(),
  description: z.string().optional(),
  authMethods: z.array(z.string()).optional(),
  apiType: z.string().optional(),
  apiBreadth: z.string().optional(),
  hasMcp: z.boolean().optional(),
  selfServe: z.boolean().optional(),
  integrationBlocker: z.string().optional(),
  toolkitReadiness: z.string().optional(),

  // Evidence tracking
  evidenceUrls: z
    .array(
      z.object({
        url: z.string().url(),
        title: z.string().optional(),
        claim: z.string(),
        retrievedAt: z.string().datetime().optional(),
      })
    )
    .default([]),

  // Verification tracking
  verificationPassRate: z
    .number()
    .min(0)
    .max(1)
    .optional(),

  // Confidence scoring
  confidenceScore: z
    .number()
    .min(0)
    .max(100)
    .describe('0-100 confidence score based on evidence and verification'),
  confidenceLabel: z.string(),
  scoringBreakdown: z
    .record(z.number())
    .optional()
    .describe('Component scores that make up total confidence'),

  // Review status
  manualReviewRequired: z.boolean(),
  reviewStatus: z
    .enum(REVIEW_STATUS as unknown as [string, ...string[]])
    .default('pending'),
  reviewNotes: z.string().optional(),

  // Metadata
  researchTimestamp: z.string().datetime(),
  verificationTimestamp: z.string().datetime(),
  scoringTimestamp: z.string().datetime(),
  lastUpdated: z.string().datetime(),
});

export type FinalFinding = z.infer<typeof FinalFindingSchema>;

/**
 * Collection of final findings.
 */
export const FinalFindingsSchema = z.array(FinalFindingSchema);
export type FinalFindings = z.infer<typeof FinalFindingsSchema>;
