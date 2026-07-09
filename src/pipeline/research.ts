/**
 * Research Pipeline
 *
 * Orchestrates the research stage:
 * 1. Load applications from apps.json (or test.json)
 * 2. Run Research Agent on each application
 * 3. Validate output against ResearchFinding schema
 * 4. Write results to output/research.json
 */

import { loadEnvironment, createLogger } from '../config/index.js';
import { AppsInputSchema } from '../models/app.js';
import { ResearchFindingsSchema } from '../models/research.js';
import { readJsonFile, writeJsonFile } from '../utils/file.js';
import { ResearchAgent } from '../agents/research.js';

const DEFAULT_APPS_FILE = 'apps/apps.json';
const DEFAULT_OUTPUT_FILE = 'output/research.json';

async function main(): Promise<void> {
  const env = loadEnvironment();
  const logger = createLogger(env);

  try {
    logger.info('🔍 Starting research pipeline');

    // Load apps
    logger.info({ file: DEFAULT_APPS_FILE }, 'Loading applications');
    const apps = await readJsonFile(DEFAULT_APPS_FILE, AppsInputSchema, logger);
    logger.info({ count: apps.length }, 'Loaded applications');

    if (apps.length === 0) {
      logger.warn('No applications to research');
      return;
    }

    // Initialize research agent
    const agent = new ResearchAgent(env, logger);

    // Research applications
    logger.info('Starting research on all applications');
    const findings = await agent.researchBatch(apps);

    // Validate results
    logger.info('Validating research findings');
    const validated = ResearchFindingsSchema.parse(findings);

    // Write results
    logger.info({ file: DEFAULT_OUTPUT_FILE }, 'Writing research results');
    await writeJsonFile(DEFAULT_OUTPUT_FILE, validated, logger);

    logger.info(
      {
        total: apps.length,
        successful: validated.length,
        failed: apps.length - validated.length,
      },
      '✅ Research pipeline completed'
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    logger.error({ error: errorMsg, stack: errorStack }, '❌ Research pipeline failed');
    process.exit(1);
  }
}

main();
