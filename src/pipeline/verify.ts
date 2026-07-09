/**
 * Verification Pipeline
 *
 * Independently verifies research findings.
 * Input: output/research.json
 * Output: output/verification.json
 */

import { loadEnvironment, createLogger } from '../config/index.js';
import { ResearchFindingsSchema, VerificationFindingsSchema } from '../models/index.js';
import { readJsonFile, writeJsonFile } from '../utils/file.js';
import { VerificationAgent } from '../agents/verification.js';

const INPUT_FILE = 'output/research.json';
const OUTPUT_FILE = 'output/verification.json';

async function main(): Promise<void> {
  const env = loadEnvironment();
  const logger = createLogger(env);

  try {
    logger.info('✓ Starting verification pipeline');

    // Load research findings
    logger.info({ file: INPUT_FILE }, 'Loading research findings');
    const researchFindings = await readJsonFile(
      INPUT_FILE,
      ResearchFindingsSchema,
      logger
    );
    logger.info({ count: researchFindings.length }, 'Loaded research findings');

    if (researchFindings.length === 0) {
      logger.warn('No findings to verify');
      return;
    }

    // Initialize verification agent
    const agent = new VerificationAgent(env, logger);

    // Verify all findings
    logger.info('Verifying all findings');
    const verifications = await agent.verifyBatch(researchFindings as any);

    // Validate results
    logger.info('Validating verification results');
    const validated = VerificationFindingsSchema.parse(verifications);

    // Write output
    logger.info({ file: OUTPUT_FILE }, 'Writing verification results');
    await writeJsonFile(OUTPUT_FILE, validated, logger);

    // Summary
    const passedCount = validated.filter((v) => v.passRate > 0.8).length;
    const failedCount = validated.filter((v) => v.passRate < 0.5).length;
    const manualReviewCount = validated.filter((v) => v.flaggedForReview).length;

    logger.info(
      {
        total: validated.length,
        passed: passedCount,
        failed: failedCount,
        needsReview: manualReviewCount,
      },
      '✓ Verification pipeline completed'
    );
  } catch (error) {
    logger.error({ error }, '✗ Verification pipeline failed');
    process.exit(1);
  }
}

main();
