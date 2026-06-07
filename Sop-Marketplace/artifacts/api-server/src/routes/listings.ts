import { Router, type IRouter } from "express";
import { eq, and, gte, lte, ilike, sql, desc } from "drizzle-orm";
import { db, listingsTable, usersTable } from "@workspace/db";
import {
  ListListingsQueryParams,
  ListListingsResponseItem,
  CreateListingBody,
  GetListingParams,
  UpdateListingParams,
  UpdateListingBody,
  UpdateListingResponse,
  DeleteListingParams,
} from "@workspace/api-zod";
import { requireAuth } from "./users";
import { randomUUID } from "crypto";

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
    sellerName: seller?.name ?? l.sellerName ?? "Unknown",
    sellerAvatar: seller?.avatarUrl ?? null,
    images: Array.isArray(l.images) ? l.images : [],
    createdAt: l.createdAt instanceof Date ? l.createdAt.toISOString() : l.createdAt,
  };
}

// GET /listings
router.get("/listings", async (req, res): Promise<void> => {
  const parsed = ListListingsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { category, keyword, priceMin, priceMax, sellerId, status, limit = 40, offset = 0 } = parsed.data;

  const conditions = [];
  if (category) conditions.push(eq(listingsTable.category, category));
  if (keyword) conditions.push(ilike(listingsTable.title, `%${keyword}%`));
  if (priceMin !== undefined) conditions.push(gte(sql`CAST(${listingsTable.price} AS numeric)`, String(priceMin)));
  if (priceMax !== undefined) conditions.push(lte(sql`CAST(${listingsTable.price} AS numeric)`, String(priceMax)));
  if (sellerId) conditions.push(eq(listingsTable.sellerId, sellerId));
  if (status) conditions.push(eq(listingsTable.status, status));

  const rows = await db
    .select({ listing: listingsTable, seller: usersTable })
    .from(listingsTable)
    .leftJoin(usersTable, eq(listingsTable.sellerId, usersTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(listingsTable.createdAt))
    .limit(Number(limit))
    .offset(Number(offset));

  res.json(rows.map((r) => ListListingsResponseItem.parse(formatListing(r.listing, r.seller))));
});

// GET /listings/featured
router.get("/listings/featured", async (_req, res): Promise<void> => {
  // Get all available listings ordered by newest, grouped by category
  const rows = await db
    .select({ listing: listingsTable, seller: usersTable })
    .from(listingsTable)
    .leftJoin(usersTable, eq(listingsTable.sellerId, usersTable.id))
    .where(eq(listingsTable.status, "available"))
    .orderBy(desc(listingsTable.createdAt))
    .limit(200);

  // Group by category (up to 12 per row)
  const byCategory = new Map<string, any[]>();
  for (const r of rows) {
    const cat = r.listing.category;
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    const arr = byCategory.get(cat)!;
    if (arr.length < 12) arr.push(formatListing(r.listing, r.seller));
  }

  const result = Array.from(byCategory.entries()).map(([category, listings]) => ({
    category,
    listings,
  }));

  res.json(result);
});

// GET /listings/categories
router.get("/listings/categories", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      category: listingsTable.category,
      count: sql<number>`CAST(COUNT(*) AS integer)`,
    })
    .from(listingsTable)
    .where(eq(listingsTable.status, "available"))
    .groupBy(listingsTable.category)
    .orderBy(sql`COUNT(*) DESC`);

  res.json(rows.map((r) => ({ category: r.category, count: Number(r.count) })));
});

// GET /listings/:id
router.get("/listings/:id", async (req, res): Promise<void> => {
  const params = GetListingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({ listing: listingsTable, seller: usersTable })
    .from(listingsTable)
    .leftJoin(usersTable, eq(listingsTable.sellerId, usersTable.id))
    .where(eq(listingsTable.id, params.data.id))
    .limit(1);

  if (!row) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  const seller = row.seller;
  // Count seller totals
  const [sellerStats] = await db
    .select({
      totalListings: sql<number>`CAST(COUNT(*) AS integer)`,
    })
    .from(listingsTable)
    .where(eq(listingsTable.sellerId, row.listing.sellerId));

  const sellerProfile = seller ? {
    id: seller.id,
    name: seller.name,
    email: seller.email ?? null,
    avatarUrl: seller.avatarUrl ?? null,
    bio: seller.bio ?? null,
    createdAt: seller.createdAt.toISOString(),
    totalListings: Number(sellerStats?.totalListings ?? 0),
    totalSales: 0,
  } : null;

  res.json({
    ...formatListing(row.listing, seller),
    seller: sellerProfile,
  });
});

// POST /listings
router.post("/listings", requireAuth, async (req: any, res): Promise<void> => {
  const parsed = CreateListingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const userId = req.userId as string;
  const { title, description, price, category, images } = parsed.data;

  const id = randomUUID();
  const [listing] = await db.insert(listingsTable).values({
    id,
    title,
    description: description ?? null,
    price: String(price),
    category,
    status: "available",
    sellerId: userId,
    images: images ?? [],
  }).returning();

  const [seller] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  res.status(201).json(formatListing(listing, seller));
});

// PATCH /listings/:id
router.patch("/listings/:id", requireAuth, async (req: any, res): Promise<void> => {
  const params = UpdateListingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateListingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.userId as string;
  const [existing] = await db.select().from(listingsTable).where(eq(listingsTable.id, params.data.id)).limit(1);
  if (!existing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }
  if (existing.sellerId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  const { title, description, price, category, status, images } = parsed.data;
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (price !== undefined) updates.price = String(price);
  if (category !== undefined) updates.category = category;
  if (status !== undefined) updates.status = status;
  if (images !== undefined) updates.images = images;

  const [updated] = await db.update(listingsTable).set(updates).where(eq(listingsTable.id, params.data.id)).returning();
  const [seller] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  res.json(UpdateListingResponse.parse(formatListing(updated, seller)));
});

// DELETE /listings/:id
router.delete("/listings/:id", requireAuth, async (req: any, res): Promise<void> => {
  const params = DeleteListingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const userId = req.userId as string;
  const [existing] = await db.select().from(listingsTable).where(eq(listingsTable.id, params.data.id)).limit(1);
  if (!existing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }
  if (existing.sellerId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  await db.delete(listingsTable).where(eq(listingsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
