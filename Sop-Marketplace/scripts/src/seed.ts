import { db, usersTable, listingsTable } from "@workspace/db";
import { randomUUID } from "crypto";

const SELLERS = [
  {
    id: "seed_seller_1",
    name: "Maya Chen",
    email: "maya@example.com",
    avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=maya",
    bio: "Vintage enthusiast and sustainable fashion advocate.",
  },
  {
    id: "seed_seller_2",
    name: "Jordan Lee",
    email: "jordan@example.com",
    avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=jordan",
    bio: "Electronics hobbyist. Everything tested before listing.",
  },
  {
    id: "seed_seller_3",
    name: "Sam Rivera",
    email: "sam@example.com",
    avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=sam",
    bio: "Books and home goods — keeping things out of the landfill.",
  },
];

const LISTINGS: Array<{
  title: string;
  description: string;
  price: number;
  category: string;
  sellerId: string;
  images: string[];
}> = [
  // Clothing
  {
    title: "Vintage Levi's 501 Jeans — W30 L32",
    description: "Classic 90s cut, medium wash, barely worn. Some natural fading at knees.",
    price: 45,
    category: "Clothing",
    sellerId: "seed_seller_1",
    images: ["https://images.unsplash.com/photo-1542272604-787c3835535d?w=600"],
  },
  {
    title: "Patagonia Fleece Pullover — Medium",
    description: "Synchilla snap-T in forest green. Washed once, no pilling.",
    price: 68,
    category: "Clothing",
    sellerId: "seed_seller_1",
    images: ["https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600"],
  },
  {
    title: "Silk Blouse — Size S",
    description: "Elegant cream silk blouse, dry-cleaned and ready to wear.",
    price: 32,
    category: "Clothing",
    sellerId: "seed_seller_1",
    images: ["https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=600"],
  },
  {
    title: "Bomber Jacket — Navy, L",
    description: "Military-style satin bomber. Minor scuff on one sleeve, priced accordingly.",
    price: 55,
    category: "Clothing",
    sellerId: "seed_seller_3",
    images: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600"],
  },
  // Electronics
  {
    title: "Sony WH-1000XM4 Headphones",
    description: "Noise-cancelling over-ear headphones. Comes with original case and cables.",
    price: 149,
    category: "Electronics",
    sellerId: "seed_seller_2",
    images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600"],
  },
  {
    title: "iPad Pro 11\" (2021) 128GB",
    description: "WiFi only, space grey, 128GB. Includes Apple Pencil 2nd gen. Screen protector since day one.",
    price: 520,
    category: "Electronics",
    sellerId: "seed_seller_2",
    images: ["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600"],
  },
  {
    title: "Logitech MX Master 3 Mouse",
    description: "Used for 6 months, works flawlessly. Scroll wheel still feels brand new.",
    price: 55,
    category: "Electronics",
    sellerId: "seed_seller_2",
    images: ["https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600"],
  },
  {
    title: "Kindle Paperwhite 11th Gen",
    description: "Waterproof, 8GB, black. Comes with case. Zero scratches.",
    price: 75,
    category: "Electronics",
    sellerId: "seed_seller_3",
    images: ["https://images.unsplash.com/photo-1592434134753-a70baf7979d5?w=600"],
  },
  // Books
  {
    title: "Design of Everyday Things — Don Norman",
    description: "Revised expanded edition. Highlighted lightly in pencil (erasable). Great condition.",
    price: 14,
    category: "Books",
    sellerId: "seed_seller_3",
    images: ["https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600"],
  },
  {
    title: "Atomic Habits — James Clear",
    description: "Hardcover, unread, received as a gift and already own a copy.",
    price: 16,
    category: "Books",
    sellerId: "seed_seller_3",
    images: ["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600"],
  },
  {
    title: "The Art of War — Sun Tzu (Deluxe Edition)",
    description: "Leather-bound collectible edition. Perfect gift condition.",
    price: 22,
    category: "Books",
    sellerId: "seed_seller_1",
    images: ["https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600"],
  },
  // Home & Garden
  {
    title: "Ceramic Plant Pots Set (3)",
    description: "Handmade matte white terracotta pots, 3\", 5\", 7\". Small chip on the largest — shown in photos.",
    price: 28,
    category: "Home & Garden",
    sellerId: "seed_seller_1",
    images: ["https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=600"],
  },
  {
    title: "IKEA KALLAX Shelf Unit — White 4x4",
    description: "Assembly required. All original hardware included. One corner has a small scratch.",
    price: 85,
    category: "Home & Garden",
    sellerId: "seed_seller_3",
    images: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600"],
  },
  {
    title: "Nespresso Vertuo Next Coffee Maker",
    description: "Used daily for 1 year, descaled and cleaned. Includes 10 pods.",
    price: 60,
    category: "Home & Garden",
    sellerId: "seed_seller_2",
    images: ["https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600"],
  },
  // Sports & Outdoors
  {
    title: "Trek FX3 Hybrid Bike — 54cm",
    description: "2020 model, ~500 miles. New brake pads, tuned last month. Comes with lock and lights.",
    price: 480,
    category: "Sports & Outdoors",
    sellerId: "seed_seller_2",
    images: ["https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600"],
  },
  {
    title: "Yoga Mat — Manduka PRO",
    description: "6mm thick, non-slip. Used for 2 years of regular practice. Wiped down after every use.",
    price: 45,
    category: "Sports & Outdoors",
    sellerId: "seed_seller_1",
    images: ["https://images.unsplash.com/photo-1601925228550-9a43cc43fb07?w=600"],
  },
  // Collectibles & Art
  {
    title: "Vintage Polaroid OneStep Express Camera",
    description: "Works perfectly. Includes partial pack of film (6 shots left). Tested before listing.",
    price: 88,
    category: "Collectibles & Art",
    sellerId: "seed_seller_1",
    images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600"],
  },
  {
    title: "Framed Street Art Print — 18x24\"",
    description: "Limited run screen print, artist-signed, numbered 42/100. IKEA ribba frame included.",
    price: 95,
    category: "Collectibles & Art",
    sellerId: "seed_seller_3",
    images: ["https://images.unsplash.com/photo-1578926288207-a90a103c8ede?w=600"],
  },
];

async function seed() {
  console.log("Seeding users...");
  for (const seller of SELLERS) {
    await db
      .insert(usersTable)
      .values(seller)
      .onConflictDoNothing();
  }
  console.log(`Inserted ${SELLERS.length} sellers`);

  console.log("Seeding listings...");
  let count = 0;
  for (const listing of LISTINGS) {
    await db
      .insert(listingsTable)
      .values({
        id: randomUUID(),
        ...listing,
        price: String(listing.price),
        status: "available",
      })
      .onConflictDoNothing();
    count++;
  }
  console.log(`Inserted ${count} listings`);
  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
