import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, usersTable, listingsTable, ordersTable } from "@workspace/db";
import { GetSellerParams, GetSellerListingsParams, GetSellerListingsResponseItem } from "@workspace/api-zod";

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

// GET /sellers/:id
router.get("/sellers/:id", async (req, res): Promise<void> => {
  const params = GetSellerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [seller] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id)).limit(1);
  if (!seller) {
    res.status(404).json({ error: "Seller not found" });
    return;
  }

  const [stats] = await db
    .select({
      totalListings: sql<number>`CAST(COUNT(*) AS integer)`,
    })
    .from(listingsTable)
    .where(eq(listingsTable.sellerId, params.data.id));

  const [salesStats] = await db
    .select({
      totalSales: sql<number>`CAST(COUNT(*) AS integer)`,
    })
    .from(ordersTable)
    .where(eq(ordersTable.sellerId, params.data.id));

  res.json({
    id: seller.id,
    name: seller.name,
    email: seller.email ?? null,
    avatarUrl: seller.avatarUrl ?? null,
    bio: seller.bio ?? null,
    createdAt: seller.createdAt.toISOString(),
    totalListings: Number(stats?.totalListings ?? 0),
    totalSales: Number(salesStats?.totalSales ?? 0),
  });
});

// GET /sellers/:id/listings
router.get("/sellers/:id/listings", async (req, res): Promise<void> => {
  const params = GetSellerListingsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [seller] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id)).limit(1);

  const rows = await db
    .select()
    .from(listingsTable)
    .where(eq(listingsTable.sellerId, params.data.id))
    .orderBy(desc(listingsTable.createdAt));

  res.json(rows.map((l) => GetSellerListingsResponseItem.parse(formatListing(l, seller))));
});

export default router;
