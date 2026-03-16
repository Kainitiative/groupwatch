import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@workspace/db";
import { usersTable, passwordResetTokensTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function getUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()));
  return user ?? null;
}

export async function getUserById(id: string) {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id));
  return user ?? null;
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.insert(passwordResetTokensTable).values({
    userId,
    tokenHash,
    expiresAt,
  });

  return token;
}

export async function consumePasswordResetToken(token: string) {
  const tokenHash = hashToken(token);
  const now = new Date();

  const [record] = await db
    .select()
    .from(passwordResetTokensTable)
    .where(
      and(
        eq(passwordResetTokensTable.tokenHash, tokenHash),
        gt(passwordResetTokensTable.expiresAt, now),
      )
    );

  if (!record || record.usedAt) return null;

  await db
    .update(passwordResetTokensTable)
    .set({ usedAt: now })
    .where(eq(passwordResetTokensTable.id, record.id));

  return record;
}
