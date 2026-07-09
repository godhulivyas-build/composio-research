import { z } from 'zod';

/**
 * Input SaaS application to be researched.
 * Minimal structure - name and optional notes.
 */
export const AppInputSchema = z.object({
  name: z.string().min(1, 'App name is required'),
  description: z.string().optional(),
});

export type AppInput = z.infer<typeof AppInputSchema>;

/**
 * Array of apps for batch processing.
 */
export const AppsInputSchema = z.array(AppInputSchema);
export type AppsInput = z.infer<typeof AppsInputSchema>;
