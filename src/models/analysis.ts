import { z } from 'zod';

/**
 * Cross-application pattern analysis results.
 * Generated from final findings to identify trends.
 */

export const AnalysisMetricsSchema = z.object({
  totalAppsResearched: z.number().int().nonnegative(),
  appsFullyVerified: z.number().int().nonnegative(),
  averageConfidenceScore: z.number().min(0).max(100),
  appsRequiringReview: z.number().int().nonnegative(),
  verificationPassRate: z.number().min(0).max(1),
});

export type AnalysisMetrics = z.infer<typeof AnalysisMetricsSchema>;

export const DistributionSchema = z.object({
  label: z.string(),
  count: z.number().int().nonnegative(),
  percentage: z.number().min(0).max(100),
});

export type Distribution = z.infer<typeof DistributionSchema>;

export const PatternAnalysisSchema = z.object({
  generatedAt: z.string().datetime(),
  metrics: AnalysisMetricsSchema,

  // Authentication trends
  authMethodDistribution: z.array(DistributionSchema),
  oauthAdoption: z.number().min(0).max(100),

  // API trends
  apiTypeDistribution: z.array(DistributionSchema),
  restVsGraphql: z
    .object({
      rest: z.number().int().nonnegative(),
      graphql: z.number().int().nonnegative(),
      other: z.number().int().nonnegative(),
      none: z.number().int().nonnegative(),
    })
    .optional(),

  // Access patterns
  selfServePercentage: z.number().min(0).max(100),
  gatedAccessPercentage: z.number().min(0).max(100),

  // MCP & Toolkit readiness
  mcpReadyApps: z.number().int().nonnegative(),
  mcpReadinessPercentage: z.number().min(0).max(100),
  toolkitReadyApps: z.number().int().nonnegative(),
  toolkitReadinessPercentage: z.number().min(0).max(100),

  // Category analysis
  categoryDistribution: z.array(DistributionSchema),

  // Integration blockers
  commonBlockers: z.array(
    z.object({
      blocker: z.string(),
      frequency: z.number().int().nonnegative(),
      percentage: z.number().min(0).max(100),
    })
  ),

  // Confidence distribution
  confidenceDistribution: z
    .object({
      fullyVerified: z.number().int().nonnegative(),
      officialDocs: z.number().int().nonnegative(),
      mostlyVerified: z.number().int().nonnegative(),
      partialEvidence: z.number().int().nonnegative(),
      weakEvidence: z.number().int().nonnegative(),
    })
    .optional(),

  // Key insights
  insights: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
});

export type PatternAnalysis = z.infer<typeof PatternAnalysisSchema>;
