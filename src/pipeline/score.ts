/**
 * Confidence Scoring Pipeline
 *
 * Deterministic confidence scoring based on evidence and verification.
 * Input: output/research.json, output/verification.json
 * Output: output/final_findings.json
 */

import { loadEnvironment, createLogger, CONFIDENCE_THRESHOLDS, getConfidenceLabel } from '../config/index.js';
import {
  ResearchFindingsSchema,
  VerificationFindingsSchema,
  FinalFindingsSchema,
  FinalFinding,
} from '../models/index.js';
import { readJsonFile, writeJsonFile } from '../utils/file.js';

const RESEARCH_FILE = 'output/research.json';
const VERIFICATION_FILE = 'output/verification.json';
const OUTPUT_FILE = 'output/final_findings.json';

type ResearchFindingType = (typeof ResearchFindingsSchema)['_output'][number];
type VerificationFindingType = (typeof VerificationFindingsSchema)['_output'][number];

interface ScoringInput {
  research: Map<string, ResearchFindingType>;
  verification: Map<string, VerificationFindingType>;
}

/**
 * Calculate confidence score based on multiple factors
 */
function calculateConfidenceScore(
  appName: string,
  scoring: ScoringInput
): number {
  const researchFinding = scoring.research.get(appName);
  const verificationFinding = scoring.verification.get(appName);

  if (!researchFinding) {
    return 0; // No research = no confidence
  }

  let score = 50; // Base score

  // Evidence quality (0-20 points)
  const evidenceCount = (researchFinding.evidenceUrls as any)?.length || 0;
  const evidencePoints = Math.min(20, evidenceCount * 5);
  score += evidencePoints;

  // Field completeness (0-20 points)
  const fieldsPopulated = [
    (researchFinding as any).category,
    (researchFinding as any).description,
    (researchFinding as any).authMethods,
    (researchFinding as any).apiType,
    (researchFinding as any).apiBreadth,
  ].filter(Boolean).length;
  const completenessPoints = (fieldsPopulated / 5) * 20;
  score += completenessPoints;

  // Verification agreement (0-30 points)
  if (verificationFinding) {
    const passRate = (verificationFinding as any).passRate || 0;
    const verificationPoints = passRate * 30;
    score += verificationPoints;

    // Penalty for manual review flag
    if ((verificationFinding as any).flaggedForReview) {
      score -= 10;
    }
  }

  // Cap score at 100
  return Math.min(100, Math.max(0, Math.round(score)));
}

async function main(): Promise<void> {
  const env = loadEnvironment();
  const logger = createLogger(env);

  try {
    logger.info('✓ Starting confidence scoring pipeline');

    // Load research findings
    logger.info({ file: RESEARCH_FILE }, 'Loading research findings');
    const researchFindings = await readJsonFile(
      RESEARCH_FILE,
      ResearchFindingsSchema,
      logger
    );

    // Load verification findings
    logger.info({ file: VERIFICATION_FILE }, 'Loading verification findings');
    const verificationFindings = await readJsonFile(
      VERIFICATION_FILE,
      VerificationFindingsSchema,
      logger
    );

    // Create maps for quick lookup
    const researchMap = new Map(
      researchFindings.map((f) => [f.appName, f])
    ) as Map<string, ResearchFindingType>;
    const verificationMap = new Map(
      verificationFindings.map((f) => [f.appName, f])
    ) as Map<string, VerificationFindingType>;

    const scoring: ScoringInput = {
      research: researchMap,
      verification: verificationMap,
    };

    // Calculate confidence scores
    logger.info('Calculating confidence scores');
    const finalFindings: FinalFinding[] = researchFindings.map(
      (research) => {
        const score = calculateConfidenceScore(research.appName, scoring);
        const verification = verificationMap.get(research.appName);

        const returning: FinalFinding = {
          appName: research.appName,
          category: (research as any).category,
          description: (research as any).description,
          authMethods: (research as any).authMethods,
          apiType: (research as any).apiType,
          apiBreadth: (research as any).apiBreadth,
          hasMcp: (research as any).hasMcp,
          selfServe: (research as any).selfServe,
          integrationBlocker: (research as any).integrationBlocker,
          toolkitReadiness: (research as any).toolkitReadiness,
          evidenceUrls: ((research as any).evidenceUrls || []) as any,
          verificationPassRate: (verification as any)?.passRate,
          confidenceScore: score,
          confidenceLabel: getConfidenceLabel(score),
          scoringBreakdown: {
            evidence: Math.min(20, (((research as any).evidenceUrls?.length || 0)) * 5),
            completeness: calculateCompletenessScore(research),
            verification: ((verification as any)?.passRate || 0) * 30,
          },
          manualReviewRequired:
            score < 70 || (((verification as any)?.flaggedForReview) ?? false),
          reviewStatus: 'pending',
          reviewNotes: generateReviewNotes(research, verification, score),
          researchTimestamp: (research as any).timestamp,
          verificationTimestamp: (verification as any)?.timestamp || new Date().toISOString(),
          scoringTimestamp: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        };
        return returning;
      }
    );

    // Validate results
    logger.info('Validating scored findings');
    const validated = FinalFindingsSchema.parse(finalFindings);

    // Write output
    logger.info({ file: OUTPUT_FILE }, 'Writing final findings');
    await writeJsonFile(OUTPUT_FILE, validated, logger);

    // Summary
    const high = validated.filter((f) => f.confidenceScore >= CONFIDENCE_THRESHOLDS.FULLY_VERIFIED).length;
    const medium = validated.filter(
      (f) =>
        f.confidenceScore >= CONFIDENCE_THRESHOLDS.MOSTLY_VERIFIED &&
        f.confidenceScore < CONFIDENCE_THRESHOLDS.FULLY_VERIFIED
    ).length;
    const low = validated.filter((f) => f.confidenceScore < CONFIDENCE_THRESHOLDS.MOSTLY_VERIFIED).length;
    const avgScore = Math.round(
      validated.reduce((sum, f) => sum + f.confidenceScore, 0) / validated.length
    );

    logger.info(
      {
        total: validated.length,
        highConfidence: high,
        mediumConfidence: medium,
        lowConfidence: low,
        averageScore: avgScore,
      },
      '✓ Confidence scoring pipeline completed'
    );
  } catch (error) {
    logger.error({ error }, '✗ Confidence scoring pipeline failed');
    process.exit(1);
  }
}

function calculateCompletenessScore(research: any): number {
  const fieldsPopulated = [
    research.category,
    research.description,
    research.authMethods,
    research.apiType,
    research.apiBreadth,
  ].filter(Boolean).length;
  return (fieldsPopulated / 5) * 20;
}

function generateReviewNotes(
  research: any,
  verification: any,
  score: number
): string | undefined {
  const notes: string[] = [];

  if (score < 50) {
    notes.push('Low confidence score - extensive manual review needed');
  } else if (score < 70) {
    notes.push('Moderate confidence - some fields need verification');
  }

  const evUrls = research.evidenceUrls;
  if (!evUrls || evUrls.length === 0) {
    notes.push('No evidence URLs provided');
  }

  if (verification?.flaggedForReview) {
    notes.push('Verification agent flagged for manual review');
  }

  if (verification && verification.passRate < 0.5) {
    notes.push('Low verification pass rate');
  }

  return notes.length > 0 ? notes.join('. ') : undefined;
}

main();
