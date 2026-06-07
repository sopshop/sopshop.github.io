import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, ordersTable, listingsTable } from "@workspace/db";
import { requireAuth } from "./users";

const router: IRouter = Router();

async function formatOrder(order: any) {
  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, order.listingId)).limit(1);
  return {
    id: order.id,
    listingId: order.listingId,
    listingTitle: listing?.title ?? "Unknown",
    listingImage: listing?.images?.[0] ?? null,
    buyerId: order.buyerId,
    sellerId: order.sellerId,
    amount: Number(order.amount),
    status: order.status,
    stripeSessionId: order.stripeSessionId ?? null,
    createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
  };
}

// GET /users/me/orders
router.get("/users/me/orders", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.buyerId, userId))
    .orderBy(desc(ordersTable.createdAt));

  const formatted = await Promise.all(orders.map(formatOrder));
  res.json(formatted);
});

// GET /users/me/sales
router.get("/users/me/sales", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.sellerId, userId))
    .orderBy(desc(ordersTable.createdAt));

  const formatted = await Promise.all(orders.map(formatOrder));
  res.json(formatted);
});

export default router;
