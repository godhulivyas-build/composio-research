import { promises as fs } from 'fs';
import { dirname } from 'path';
import { z } from 'zod';
import pino from 'pino';

/**
 * Safely read and parse a JSON file with Zod validation.
 */
export async function readJsonFile<T>(
  filePath: string,
  schema: z.ZodSchema<T>,
  logger?: pino.Logger
): Promise<T> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(content) as unknown;
    const validated = schema.parse(parsed);
    return validated;
  } catch (error) {
    if (logger) {
      logger.error({ error, filePath }, 'Failed to read JSON file');
    }
    throw new Error(`Failed to read ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Write data to a JSON file with pretty formatting.
 * Creates parent directories if they don't exist.
 */
export async function writeJsonFile<T>(
  filePath: string,
  data: T,
  logger?: pino.Logger
): Promise<void> {
  try {
    const dir = dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    const json = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, json, 'utf-8');
    if (logger) {
      logger.info({ filePath }, 'Wrote JSON file');
    }
  } catch (error) {
    if (logger) {
      logger.error({ error, filePath }, 'Failed to write JSON file');
    }
    throw new Error(
      `Failed to write ${filePath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Check if a file exists.
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read a plain text file.
 */
export async function readTextFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8');
}

/**
 * Write a plain text file.
 */
export async function writeTextFile(filePath: string, content: string): Promise<void> {
  const dir = dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, content, 'utf-8');
}
