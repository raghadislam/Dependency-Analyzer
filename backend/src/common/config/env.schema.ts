import { z } from 'zod';

export const envSchema = z.object({
  COGNODB_URI: z
    .string({ message: 'COGNODB_URI environment variable is required' })
    .min(1, 'COGNODB_URI cannot be empty'),

  COGNODB_USER: z
    .string({ message: 'COGNODB_USER environment variable is required' })
    .min(1, 'COGNODB_USER cannot be empty'),

  COGNODB_PASSWORD: z
    .string({ message: 'COGNODB_PASSWORD environment variable is required' })
    .min(1, 'COGNODB_PASSWORD cannot be empty'),

  PORT: z.coerce
    .number()
    .int('PORT must be an integer')
    .min(1, 'PORT must be at least 1')
    .max(65535, 'PORT must be at most 65535')
    .default(3000),

  CORS_ORIGIN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || 'root'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables configuration:\n${errors}`);
  }

  return result.data;
}
