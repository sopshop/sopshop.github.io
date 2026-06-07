import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, listingsTable, usersTable } from "@workspace/db";
import { GetMyListingsResponseItem } from "@workspace/api-zod";
import { requireAuth } from "./users";

const router: IRouter = Router();

function formatListing(l: any, seller?: any) {
  return {
    id: l.id,
    title: l.title,
    description: l.description ?? null,
    price: Number(l.price),
    category: l.category,
    status: l.status,
    sellerId: l.sellerId,
    sellerName: seller?.name ?? "Unknown",
    sellerAvatar: seller?.avatarUrl ?? null,
    images: Array.isArray(l.images) ? l.images : [],
    createdAt: l.createdAt instanceof Date ? l.createdAt.toISOString() : l.createdAt,
  };
}

// GET /users/me/listings
router.get("/users/me/listings", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const [seller] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const rows = await db
    .select()
    .from(listingsTable)
    .where(eq(listingsTable.sellerId, userId))
    .orderBy(desc(listingsTable.createdAt));

  res.json(rows.map((l) => GetMyListingsResponseItem.parse(formatListing(l, seller))));
});

export default router;
