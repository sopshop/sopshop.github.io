import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { SyncUserResponse, GetMeResponse, UpdateMeBody, UpdateMeResponse } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;
  next();
}

// POST /users/sync — JIT provision Clerk user
router.post("/users/sync", requireAuth, async (req: any, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = req.userId as string;

  // Try to get extra info from Clerk claims
  const claims = auth?.sessionClaims as any;
  const name = claims?.name || claims?.fullName || claims?.firstName || "User";
  const email = claims?.email || claims?.primaryEmail || null;
  const avatarUrl = claims?.imageUrl || null;

  const existing = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  if (existing.length > 0) {
    // Update name/email/avatar if changed
    const [updated] = await db.update(usersTable)
      .set({ name, email, avatarUrl, updatedAt: new Date() })
      .where(eq(usersTable.id, userId))
      .returning();
    res.json(SyncUserResponse.parse({
      id: updated.id, name: updated.name, email: updated.email,
      avatarUrl: updated.avatarUrl, bio: updated.bio,
      createdAt: updated.createdAt.toISOString(),
    }));
    return;
  }

  const [user] = await db.insert(usersTable).values({
    id: userId, name, email, avatarUrl,
  }).returning();

  res.json(SyncUserResponse.parse({
    id: user.id, name: user.name, email: user.email,
    avatarUrl: user.avatarUrl, bio: user.bio,
    createdAt: user.createdAt.toISOString(),
  }));
});

// GET /users/me
router.get("/users/me", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found — call /users/sync first" });
    return;
  }
  res.json(GetMeResponse.parse({
    id: user.id, name: user.name, email: user.email,
    avatarUrl: user.avatarUrl, bio: user.bio,
    createdAt: user.createdAt.toISOString(),
  }));
});

// PATCH /users/me
router.patch("/users/me", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, bio, avatarUrl } = parsed.data;
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (name !== undefined) updates.name = name;
  if (bio !== undefined) updates.bio = bio;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, userId)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(UpdateMeResponse.parse({
    id: user.id, name: user.name, email: user.email,
    avatarUrl: user.avatarUrl, bio: user.bio,
    createdAt: user.createdAt.toISOString(),
  }));
});

export { requireAuth };
export default router;
