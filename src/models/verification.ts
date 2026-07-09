import { z } from 'zod';

/**
 * Verification result for a single claim or field.
 */
export const VerificationResultSchema = z.object({
  field: z.string().min(1),
  originalClaim: z.string(),
  verified: z.boolean(),
  conflict: z
    .boolean()
    .describe('Whether verification contradicts original finding'),
  evidence: z.string().optional(),
  notes: z.string().optional(),
});

export type VerificationResult = z.infer<typeof VerificationResultSchema>;

/**
 * Verification findings for a single SaaS application.
 * Output from Verification Agent.
 */
export const VerificationFindingSchema = z.object({
  appName: z.string().min(1),
  verificationsPassed: z.number().int().nonnegative(),
  verificationsTotal: z.number().int().positive(),
  passRate: z
    .number()
    .min(0)
    .max(1)
    .describe('0-1 representing percentage verified'),
  results: z.array(VerificationResultSchema),
  flaggedForReview: z.boolean(),
  reviewReason: z
    .string()
    .optional()
    .describe('Why this record needs manual review'),
  independentFindings: z.record(z.unknown()).optional().describe('Independently discovered facts'),
  timestamp: z.string().datetime().default(() => new Date().toISOString()),
});

export type VerificationFinding = z.infer<typeof VerificationFindingSchema>;

/**
 * Collection of verification findings.
 */
export const VerificationFindingsSchema = z.array(VerificationFindingSchema);
export type VerificationFindings = z.infer<typeof VerificationFindingsSchema>;
