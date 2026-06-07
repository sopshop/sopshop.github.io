import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, listingsTable, usersTable, ordersTable } from "@workspace/db";
import { CreateCheckoutBody, CheckoutSuccessQueryParams } from "@workspace/api-zod";
import { getUncachableStripeClient } from "../stripeClient";
import { requireAuth } from "./users";
import { randomUUID } from "crypto";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// POST /checkout
router.post("/checkout", requireAuth, async (req: any, res): Promise<void> => {
  const parsed = CreateCheckoutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.userId as string;
  const { listingId } = parsed.data;

  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, listingId)).limit(1);
  if (!listing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }
  if (listing.status === "sold") {
    res.status(400).json({ error: "This item has already been sold" });
    return;
  }

  const [buyer] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  const stripe = await getUncachableStripeClient();

  // Create/find customer
  let customerId = buyer?.stripeCustomerId;
  if (!customerId && buyer?.email) {
    const customer = await stripe.customers.create({
      email: buyer.email,
      metadata: { userId },
    });
    await db.update(usersTable).set({ stripeCustomerId: customer.id }).where(eq(usersTable.id, userId));
    customerId = customer.id;
  }

  const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
  const priceAmountCents = Math.round(Number(listing.price) * 100);

  const sessionParams: any = {
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: priceAmountCents,
          product_data: {
            name: listing.title,
            description: listing.description ?? undefined,
            images: listing.images?.slice(0, 1) ?? [],
          },
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${baseUrl}/api/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/listings/${listing.id}`,
    metadata: {
      listingId: listing.id,
      buyerId: userId,
      sellerId: listing.sellerId,
    },
  };

  if (customerId) sessionParams.customer = customerId;

  const session = await stripe.checkout.sessions.create(sessionParams);
  res.json({ url: session.url });
});

// GET /checkout/success
router.get("/checkout/success", async (req, res): Promise<void> => {
  const params = CheckoutSuccessQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: "Missing session_id" });
    return;
  }

  const sessionId = params.data.session_id;

  try {
    const stripe = await getUncachableStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const { listingId, buyerId, sellerId } = session.metadata ?? {};
    if (!listingId || !buyerId || !sellerId) {
      res.status(400).json({ error: "Invalid session metadata" });
      return;
    }

    // Check if order already exists for this session
    const [existingOrder] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.stripeSessionId, sessionId))
      .limit(1);

    if (existingOrder) {
      const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, listingId)).limit(1);
      res.json({
        id: existingOrder.id,
        listingId: existingOrder.listingId,
        listingTitle: listing?.title ?? "Unknown",
        listingImage: listing?.images?.[0] ?? null,
        buyerId: existingOrder.buyerId,
        sellerId: existingOrder.sellerId,
        amount: Number(existingOrder.amount),
        status: existingOrder.status,
        stripeSessionId: existingOrder.stripeSessionId,
        createdAt: existingOrder.createdAt.toISOString(),
      });
      return;
    }

    const amountPaid = (session.amount_total ?? 0) / 100;
    const orderId = randomUUID();

    const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, listingId)).limit(1);

    const [order] = await db.insert(ordersTable).values({
      id: orderId,
      listingId,
      buyerId,
      sellerId,
      amount: String(amountPaid),
      status: session.payment_status === "paid" ? "completed" : "pending",
      stripeSessionId: sessionId,
    }).returning();

    // Mark listing as sold
    if (session.payment_status === "paid") {
      await db.update(listingsTable).set({ status: "sold", updatedAt: new Date() }).where(eq(listingsTable.id, listingId));
    }

    res.json({
      id: order.id,
      listingId: order.listingId,
      listingTitle: listing?.title ?? "Unknown",
      listingImage: listing?.images?.[0] ?? null,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      amount: Number(order.amount),
      status: order.status,
      stripeSessionId: order.stripeSessionId,
      createdAt: order.createdAt.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Checkout success handler error");
    res.status(500).json({ error: "Failed to confirm order" });
  }
});

export default router;
