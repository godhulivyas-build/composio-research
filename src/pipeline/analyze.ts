/**
 * Pattern Analysis Pipeline
 *
 * Analyzes patterns across all researched applications.
 * Input: output/final_findings.json
 * Output: output/analysis.json
 */

import { loadEnvironment, createLogger, CONFIDENCE_THRESHOLDS } from '../config/index.js';
import { FinalFindingsSchema, PatternAnalysisSchema } from '../models/index.js';
import { readJsonFile, writeJsonFile } from '../utils/file.js';

const INPUT_FILE = 'output/final_findings.json';
const OUTPUT_FILE = 'output/analysis.json';

async function main(): Promise<void> {
  const env = loadEnvironment();
  const logger = createLogger(env);

  try {
    logger.info('✓ Starting pattern analysis pipeline');

    // Load final findings
    logger.info({ file: INPUT_FILE }, 'Loading final findings');
    const findings = await readJsonFile(INPUT_FILE, FinalFindingsSchema, logger);

    if (findings.length === 0) {
      logger.warn('No findings to analyze');
      return;
    }

    logger.info('Analyzing patterns');

    // Calculate metrics
    const metrics = {
      totalAppsResearched: findings.length,
      appsFullyVerified: findings.filter(
        (f) => f.confidenceScore >= CONFIDENCE_THRESHOLDS.FULLY_VERIFIED
      ).length,
      averageConfidenceScore: Math.round(
        findings.reduce((sum, f) => sum + f.confidenceScore, 0) / findings.length
      ),
      appsRequiringReview: findings.filter((f) => f.manualReviewRequired).length,
      verificationPassRate: findings.length > 0
        ? findings.reduce((sum, f) => sum + (f.verificationPassRate || 0), 0) / findings.length
        : 0,
    };

    // Auth method distribution
    const authMethods = new Map<string, number>();
    findings.forEach((f) => {
      f.authMethods?.forEach((method) => {
        authMethods.set(method, (authMethods.get(method) || 0) + 1);
      });
    });

    const authMethodDistribution = Array.from(authMethods.entries())
      .map(([label, count]) => ({
        label,
        count,
        percentage: Math.round((count / findings.length) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    // OAuth adoption
    const oauthCount = findings.filter((f) =>
      f.authMethods?.includes('OAuth2')
    ).length;
    const oauthAdoption = Math.round((oauthCount / findings.length) * 100);

    // API type distribution
    const apiTypes = new Map<string, number>();
    findings.forEach((f) => {
      const type = f.apiType || 'None';
      apiTypes.set(type, (apiTypes.get(type) || 0) + 1);
    });

    const apiTypeDistribution = Array.from(apiTypes.entries())
      .map(([label, count]) => ({
        label,
        count,
        percentage: Math.round((count / findings.length) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    const restCount = apiTypes.get('REST') || 0;
    const graphqlCount = apiTypes.get('GraphQL') || 0;
    const otherCount = apiTypes.get('Other') || 0;
    const noneCount = apiTypes.get('None') || 0;

    // Self-serve vs gated
    const selfServeCount = findings.filter((f) => f.selfServe === true).length;
    const gatedCount = findings.filter((f) => f.selfServe === false).length;
    const unknownServeCount = findings.filter((f) => f.selfServe === null).length;

    const selfServePercentage = Math.round((selfServeCount / findings.length) * 100);
    const gatedAccessPercentage = Math.round((gatedCount / findings.length) * 100);

    // MCP support
    const mcpCount = findings.filter((f) => f.hasMcp === true).length;
    const mcpReadinessPercentage = Math.round((mcpCount / findings.length) * 100);

    // Toolkit readiness
    const readyCount = findings.filter((f) => f.toolkitReadiness === 'Ready').length;
    const toolkitReadinessPercentage = Math.round((readyCount / findings.length) * 100);

    // Category distribution
    const categories = new Map<string, number>();
    findings.forEach((f) => {
      const cat = f.category || 'Other';
      categories.set(cat, (categories.get(cat) || 0) + 1);
    });

    const categoryDistribution = Array.from(categories.entries())
      .map(([label, count]) => ({
        label,
        count,
        percentage: Math.round((count / findings.length) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    // Common blockers
    const blockers = new Map<string, number>();
    findings.forEach((f) => {
      const blocker = f.integrationBlocker;
      if (blocker) {
        blockers.set(blocker, (blockers.get(blocker) || 0) + 1);
      }
    });

    const commonBlockers = Array.from(blockers.entries())
      .map(([blocker, frequency]) => ({
        blocker,
        frequency,
        percentage: Math.round((frequency / findings.length) * 100),
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10); // Top 10

    // Confidence distribution
    const confidenceDistribution = {
      fullyVerified: findings.filter(
        (f) => f.confidenceScore >= CONFIDENCE_THRESHOLDS.FULLY_VERIFIED
      ).length,
      officialDocs: findings.filter(
        (f) =>
          f.confidenceScore >= CONFIDENCE_THRESHOLDS.OFFICIAL_DOCS &&
          f.confidenceScore < CONFIDENCE_THRESHOLDS.FULLY_VERIFIED
      ).length,
      mostlyVerified: findings.filter(
        (f) =>
          f.confidenceScore >= CONFIDENCE_THRESHOLDS.MOSTLY_VERIFIED &&
          f.confidenceScore < CONFIDENCE_THRESHOLDS.OFFICIAL_DOCS
      ).length,
      partialEvidence: findings.filter(
        (f) =>
          f.confidenceScore >= CONFIDENCE_THRESHOLDS.PARTIAL_EVIDENCE &&
          f.confidenceScore < CONFIDENCE_THRESHOLDS.MOSTLY_VERIFIED
      ).length,
      weakEvidence: findings.filter((f) => f.confidenceScore < CONFIDENCE_THRESHOLDS.PARTIAL_EVIDENCE).length,
    };

    // Generate insights
    const insights: string[] = [];

    if (oauthAdoption >= 60) {
      insights.push(
        `OAuth2 adoption is strong at ${oauthAdoption}% - industry standard for modern SaaS`
      );
    }

    if (mcpReadinessPercentage >= 30) {
      insights.push(
        `${mcpReadinessPercentage}% of applications support MCP - growing trend for AI integration`
      );
    }

    if (selfServePercentage >= 70) {
      insights.push(
        `${selfServePercentage}% of applications offer self-serve signup - low friction adoption`
      );
    }

    if (restCount > graphqlCount && restCount > 0) {
      insights.push(
        `REST APIs dominate (${restCount} apps) over GraphQL (${graphqlCount} apps) - traditional approach still prevalent`
      );
    }

    if (metrics.averageConfidenceScore >= 80) {
      insights.push(
        `Average confidence score of ${metrics.averageConfidenceScore} indicates high data quality`
      );
    }

    if (metrics.appsRequiringReview < 10) {
      insights.push(
        `Only ${metrics.appsRequiringReview} apps require manual review - research process is highly reliable`
      );
    }

    // Generate recommendations
    const recommendations: string[] = [];

    if (commonBlockers.length > 0 && commonBlockers[0]) {
      recommendations.push(
        `Address top integration blocker: "${commonBlockers[0].blocker}" (affects ${commonBlockers[0].frequency} apps)`
      );
    }

    if (gatedAccessPercentage > 40) {
      recommendations.push(
        `${gatedAccessPercentage}% of applications require approval for access - prioritize easy onboarding apps`
      );
    }

    if (unknownServeCount > findings.length * 0.2) {
      recommendations.push(
        `Many apps have unknown self-serve status - prioritize documenting access models`
      );
    }

    if (metrics.appsRequiringReview > 20) {
      recommendations.push(
        `${metrics.appsRequiringReview} apps need manual review - allocate resources for verification`
      );
    }

    recommendations.push('Prioritize integrations with REST APIs and OAuth2 support');

    // Create analysis object
    const analysis = {
      generatedAt: new Date().toISOString(),
      metrics,
      authMethodDistribution,
      oauthAdoption,
      apiTypeDistribution,
      restVsGraphql: {
        rest: restCount,
        graphql: graphqlCount,
        other: otherCount,
        none: noneCount,
      },
      selfServePercentage,
      gatedAccessPercentage,
      mcpReadyApps: mcpCount,
      mcpReadinessPercentage,
      toolkitReadyApps: readyCount,
      toolkitReadinessPercentage,
      categoryDistribution,
      commonBlockers,
      confidenceDistribution,
      insights,
      recommendations,
    };

    // Validate
    logger.info('Validating analysis');
    const validated = PatternAnalysisSchema.parse(analysis);

    // Write output
    logger.info({ file: OUTPUT_FILE }, 'Writing pattern analysis');
    await writeJsonFile(OUTPUT_FILE, validated, logger);

    logger.info(
      {
        insightCount: validated.insights?.length,
        recommendationCount: validated.recommendations?.length,
      },
      '✓ Pattern analysis pipeline completed'
    );
  } catch (error) {
    logger.error({ error }, '✗ Pattern analysis pipeline failed');
    process.exit(1);
  }
}

main();
