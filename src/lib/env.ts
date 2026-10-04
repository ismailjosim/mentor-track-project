import 'server-only';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  MONGODB_DB_NAME: z.string().default('student-management'),

  BETTER_AUTH_SECRET: z
    .string()
    .min(16, 'BETTER_AUTH_SECRET must be at least 16 characters')
    .optional()
    .or(z.literal('')),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:3000'),

  BETTER_AUTH_GOOGLE_CLIENT_ID: z.string().optional(),
  BETTER_AUTH_GOOGLE_CLIENT_SECRET: z.string().optional(),

  NEXT_PUBLIC_AUTH_URL: z.string().optional(),
  NEXT_PUBLIC_API_URL: z.string().optional(),

  ADMIN_SECRET_KEY: z.string().optional(),
  SEED_SECRET: z.string().optional(),
  ALLOW_DEMO_SEED: z.string().optional().default('false'),
});

function parseEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:\n', result.error.format());
    // Only throw in runtime, allow tooling to inspect if needed
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Invalid environment variables. See log above.');
    }
  }

  return (result.success ? result.data : process.env) as z.infer<typeof envSchema>;
}

export const env = parseEnv();
