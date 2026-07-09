import { z } from 'zod';

/**
 * Environment variables schema with validation.
 * Separates into required (always) and conditional (based on module execution).
 */

const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  LOG_LEVEL: z
    .enum(['debug', 'info', 'warn', 'error', 'fatal'])
    .default('info'),
});

const optionalServiceSchema = z.object({
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  TAVILY_API_KEY: z.string().optional(),
  FIRECRAWL_API_KEY: z.string().optional(),
});

const optionalPipelineSchema = z.object({
  MAX_CONCURRENT_RESEARCHERS: z
    .string()
    .pipe(z.coerce.number().positive())
    .default('3'),
  MAX_CONCURRENT_VERIFIERS: z
    .string()
    .pipe(z.coerce.number().positive())
    .default('2'),
  RESEARCH_TIMEOUT_MS: z
    .string()
    .pipe(z.coerce.number().positive())
    .default('60000'),
  VERIFICATION_TIMEOUT_MS: z
    .string()
    .pipe(z.coerce.number().positive())
    .default('90000'),
});

const optionalBrowserSchema = z.object({
  PLAYWRIGHT_HEADLESS: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .default('true'),
  PLAYWRIGHT_TIMEOUT: z
    .string()
    .pipe(z.coerce.number().positive())
    .default('30000'),
});

const optionalOutputSchema = z.object({
  OUTPUT_DIRECTORY: z.string().default('output'),
  REPORTS_DIRECTORY: z.string().default('reports'),
});

const fullEnvSchema = baseEnvSchema
  .merge(optionalServiceSchema)
  .merge(optionalPipelineSchema)
  .merge(optionalBrowserSchema)
  .merge(optionalOutputSchema);

export type Environment = z.infer<typeof fullEnvSchema>;

/**
 * Validates all environment variables against the schema.
 * Returns parsed env with defaults applied.
 *
 * This is always safe to call - it includes defaults for all non-secret vars.
 */
export function loadEnvironment(): Environment {
  const result = fullEnvSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.flatten();
    console.error('❌ Environment validation failed:');
    console.error(JSON.stringify(errors, null, 2));
    throw new Error('Invalid environment configuration');
  }

  return result.data;
}

/**
 * Validates that a specific required service is configured.
 * Call this from agents/tools that depend on external services.
 *
 * Usage:
 *   const env = loadEnvironment();
 *   validateService(env, 'TAVILY_API_KEY', 'Tavily search');
 */
export function validateService(
  env: Environment,
  key: keyof Pick<Environment, 'TAVILY_API_KEY' | 'FIRECRAWL_API_KEY' | 'ANTHROPIC_API_KEY' | 'OPENAI_API_KEY'>,
  serviceName: string
): void {
  if (!env[key]) {
    throw new Error(
      `❌ ${serviceName} is not configured. Please set ${key} in .env file or environment variables.`
    );
  }
}

/**
 * Get a service credential if available, returns null otherwise.
 * Safe for optional integrations.
 */
export function getServiceKey(
  env: Environment,
  key: keyof Pick<Environment, 'TAVILY_API_KEY' | 'FIRECRAWL_API_KEY' | 'ANTHROPIC_API_KEY' | 'OPENAI_API_KEY'>
): string | null {
  return env[key] || null;
}
