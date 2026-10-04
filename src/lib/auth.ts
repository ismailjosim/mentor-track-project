import { mongodbAdapter } from '@better-auth/mongo-adapter';
import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { MongoClient } from 'mongodb';
import { env } from '@/lib/env';

const uri = env.MONGODB_URI;
const dbName = env.MONGODB_DB_NAME;
const googleClientId = env.BETTER_AUTH_GOOGLE_CLIENT_ID;
const googleClientSecret = env.BETTER_AUTH_GOOGLE_CLIENT_SECRET;

const globalForMongo = globalThis as typeof globalThis & {
  betterAuthMongoClient?: MongoClient;
};

const client = globalForMongo.betterAuthMongoClient ?? new MongoClient(uri);

if (env.NODE_ENV !== 'production') {
  globalForMongo.betterAuthMongoClient = client;
}

export const auth = betterAuth({
  database: mongodbAdapter(client.db(dbName), {
    client,
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders:
    googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          },
        }
      : {},
  secret: env.BETTER_AUTH_SECRET || 'development_fallback_secret_at_least_32_chars_long',
  trustedOrigins: [env.BETTER_AUTH_URL, env.NEXT_PUBLIC_AUTH_URL, env.NEXT_PUBLIC_API_URL].filter(
    Boolean
  ) as string[],
  plugins: [nextCookies()],
});
