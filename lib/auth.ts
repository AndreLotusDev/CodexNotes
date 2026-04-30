import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { Database } from "bun:sqlite";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { sqliteDb } from "@/lib/db";

const configuredBaseUrl = process.env.BETTER_AUTH_URL ?? process.env.APP_URL;
const baseUrl =
  configuredBaseUrl && configuredBaseUrl !== "null" && URL.canParse(configuredBaseUrl)
    ? configuredBaseUrl
    : "http://localhost:3000";
const secret = process.env.BETTER_AUTH_SECRET ?? "tinynotes-local-dev-secret-change-me";

const authDatabase = new Database(sqliteDb.databasePath, {
  create: true,
  strict: true
});

export const auth = betterAuth({
  database: authDatabase,
  secret,
  baseURL: baseUrl,
  emailAndPassword: {
    enabled: true
  },
  user: {
    fields: {
      emailVerified: "email_verified",
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  },
  session: {
    fields: {
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
      ipAddress: "ip_address",
      userAgent: "user_agent",
      userId: "user_id"
    }
  },
  account: {
    fields: {
      accountId: "account_id",
      providerId: "provider_id",
      userId: "user_id",
      accessToken: "access_token",
      refreshToken: "refresh_token",
      idToken: "id_token",
      accessTokenExpiresAt: "access_token_expires_at",
      refreshTokenExpiresAt: "refresh_token_expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  },
  verification: {
    fields: {
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  },
  plugins: [nextCookies()]
});

export async function getAuthHeaders() {
  return new Headers(await headers());
}

const getCachedSession = cache(async () => {
  return auth.api.getSession({
    headers: await getAuthHeaders()
  });
});

export async function getSessionUser() {
  const session = await getCachedSession();

  if (!session?.user) {
    return null;
  }

  const createdAt =
    session.user.createdAt instanceof Date ? session.user.createdAt : new Date(session.user.createdAt);

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    createdAt: createdAt.toISOString()
  };
}

export async function requireSessionUser() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
