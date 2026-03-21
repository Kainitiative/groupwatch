import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  hashPassword,
  verifyPassword,
  getUserByEmail,
  createPasswordResetToken,
  consumePasswordResetToken,
} from "../lib/auth";
import { sendWelcomeEmail, sendPasswordResetEmail } from "../lib/email";
import { requireAuth } from "../lib/session";

const router = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(422).json({ error: "Name, email and password are required" });
    return;
  }

  if (password.length < 8) {
    res.status(422).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const existing = await getUserByEmail(email);
  if (existing) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(usersTable)
    .values({ name, email: email.toLowerCase(), passwordHash })
    .returning();

  req.session.userId = user.id;

  await new Promise<void>((resolve, reject) =>
    req.session.save((err) => (err ? reject(err) : resolve()))
  );

  sendWelcomeEmail(user.email, user.name).catch(() => {});

  res.status(201).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      isSuperAdmin: user.isSuperAdmin,
      createdAt: user.createdAt,
    },
    message: "Account created successfully",
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(422).json({ error: "Email and password are required" });
    return;
  }

  const user = await getUserByEmail(email);
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  req.session.userId = user.id;

  await new Promise<void>((resolve, reject) =>
    req.session.save((err) => (err ? reject(err) : resolve()))
  );

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      isSuperAdmin: user.isSuperAdmin,
      createdAt: user.createdAt,
    },
  });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  await new Promise<void>((resolve) => req.session.destroy(() => resolve()));
  res.clearCookie("connect.sid", { path: "/" });
  res.json({ message: "Logged out successfully" });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId!));

  if (!user) {
    res.status(401).json({ error: "Session invalid" });
    return;
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    isSuperAdmin: user.isSuperAdmin,
    createdAt: user.createdAt,
  });
});

router.post("/auth/password-reset/request", async (req, res): Promise<void> => {
  const { email } = req.body;
  if (!email) {
    res.status(200).json({ message: "If that email exists, a reset link has been sent" });
    return;
  }

  const user = await getUserByEmail(email);
  if (user) {
    const token = await createPasswordResetToken(user.id);
    sendPasswordResetEmail(user.email, user.name, token).catch(() => {});
  }

  res.json({ message: "If that email exists, a reset link has been sent" });
});

router.post("/auth/password-reset/confirm", async (req, res): Promise<void> => {
  const { token, password } = req.body;

  if (!token || !password || password.length < 8) {
    res.status(400).json({ error: "Valid token and password (min 8 characters) are required" });
    return;
  }

  const record = await consumePasswordResetToken(token);
  if (!record) {
    res.status(400).json({ error: "This link is invalid or has expired" });
    return;
  }

  const passwordHash = await hashPassword(password);
  await db
    .update(usersTable)
    .set({ passwordHash })
    .where(eq(usersTable.id, record.userId));

  res.json({ message: "Password updated successfully" });
});

export default router;
