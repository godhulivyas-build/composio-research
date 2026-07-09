/**
 * Application-wide constants.
 * Includes confidence score thresholds, timeouts, and other fixed values.
 */

export const CONFIDENCE_THRESHOLDS = {
  FULLY_VERIFIED: 95,
  OFFICIAL_DOCS: 85,
  MOSTLY_VERIFIED: 70,
  PARTIAL_EVIDENCE: 50,
  WEAK_EVIDENCE: 0,
} as const;

export const CONFIDENCE_LABELS = {
  95: 'Fully Verified',
  85: 'Official Docs',
  70: 'Mostly Verified',
  50: 'Partial Evidence',
  0: 'Weak Evidence',
} as const;

/**
 * Get confidence label for a given score.
 */
export function getConfidenceLabel(score: number): string {
  if (score >= CONFIDENCE_THRESHOLDS.FULLY_VERIFIED) {
    return CONFIDENCE_LABELS[95];
  }
  if (score >= CONFIDENCE_THRESHOLDS.OFFICIAL_DOCS) {
    return CONFIDENCE_LABELS[85];
  }
  if (score >= CONFIDENCE_THRESHOLDS.MOSTLY_VERIFIED) {
    return CONFIDENCE_LABELS[70];
  }
  if (score >= CONFIDENCE_THRESHOLDS.PARTIAL_EVIDENCE) {
    return CONFIDENCE_LABELS[50];
  }
  return CONFIDENCE_LABELS[0];
}

/**
 * SaaS application categories used in research.
 */
export const APP_CATEGORIES = [
  'Analytics',
  'Authentication',
  'CRM',
  'Database',
  'DevTools',
  'E-Commerce',
  'Finance',
  'Hosting',
  'HR',
  'Marketing',
  'Monitoring',
  'Payments',
  'Search',
  'Storage',
  'Webhooks',
  'Other',
] as const;

export type AppCategory = (typeof APP_CATEGORIES)[number];

/**
 * API types supported in research.
 */
export const API_TYPES = ['REST', 'GraphQL', 'Other', 'None'] as const;
export type ApiType = (typeof API_TYPES)[number];

/**
 * Authentication methods tracked.
 */
export const AUTH_METHODS = [
  'OAuth2',
  'API Key',
  'Basic Auth',
  'JWT',
  'Custom',
  'None',
] as const;
export type AuthMethod = (typeof AUTH_METHODS)[number];

/**
 * Integration readiness levels.
 */
export const READINESS_LEVELS = ['Ready', 'Partial', 'Limited', 'Not Ready'] as const;
export type ReadinessLevel = (typeof READINESS_LEVELS)[number];

/**
 * Status for records requiring manual review.
 */
export const REVIEW_STATUS = ['pending', 'reviewed', 'approved', 'rejected'] as const;
export type ReviewStatus = (typeof REVIEW_STATUS)[number];
