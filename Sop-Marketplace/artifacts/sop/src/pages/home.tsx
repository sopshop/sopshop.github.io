import { useRef } from "react";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useListFeaturedListings, useListCategories } from "@workspace/api-client-react";
import { Navbar } from "@/components/navbar";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function CategoryRow({ category, listings }: { category: string; listings: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: dir === "right" ? amount : -amount, behavior: "smooth" });
  };

  return (
    <section className="relative" data-testid={`section-category-${category}`}>
      <div className="flex items-center justify-between mb-3 px-4 sm:px-6">
        <Link href={`/search?category=${encodeURIComponent(category)}`}>
          <h2 className="text-base font-semibold tracking-tight hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 group">
            {category}
            <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </h2>
        </Link>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full"
            onClick={() => scroll("left")}
            data-testid={`button-scroll-left-${category}`}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full"
            onClick={() => scroll("right")}
            data-testid={`button-scroll-right-${category}`}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide px-4 sm:px-6 pb-2 snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {listings.map((listing) => (
          <div key={listing.id} className="shrink-0 w-[160px] sm:w-[180px] snap-start">
            <ListingCard listing={listing} />
          </div>
        ))}
        <div className="shrink-0 w-4" />
      </div>
    </section>
  );
}

function CategoryRowSkeleton() {
  return (
    <section className="px-4 sm:px-6">
      <Skeleton className="h-5 w-32 mb-3" />
      <div className="flex gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="shrink-0 w-[160px] sm:w-[180px]">
            <Skeleton className="aspect-[3/4] rounded-xl mb-2" />
            <Skeleton className="h-4 w-3/4 mb-1" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  const { data: featuredRows, isLoading: loadingFeatured } = useListFeaturedListings();
  const { data: categories } = useListCategories();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <div className="relative px-4 sm:px-6 py-10 sm:py-16 max-w-7xl mx-auto">
        <div className="max-w-xl">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight">
            Buy and sell<br />
            <span className="text-muted-foreground">anything.</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-sm">
            A peer-to-peer marketplace for people who care about what they buy.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/search" data-testid="button-browse">
              <Button size="sm" className="gap-1.5">
                Browse listings
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <Link href="/dashboard/new" data-testid="button-start-selling">
              <Button variant="outline" size="sm">
                Start selling
              </Button>
            </Link>
          </div>
        </div>

        {/* Category pills */}
        {categories && categories.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Link key={cat.category} href={`/search?category=${encodeURIComponent(cat.category)}`}>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground hover:border-accent hover:text-foreground transition-colors cursor-pointer"
                  data-testid={`pill-category-${cat.category}`}
                >
                  {cat.category}
                  <span className="opacity-50">{cat.count}</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Category carousels */}
      <div className="pb-16 space-y-10 max-w-7xl mx-auto">
        {loadingFeatured
          ? Array.from({ length: 3 }).map((_, i) => <CategoryRowSkeleton key={i} />)
          : featuredRows && featuredRows.length > 0
          ? featuredRows.map((row) => (
              <CategoryRow
                key={row.category}
                category={row.category}
                listings={row.listings}
              />
            ))
          : (
            <div className="px-4 sm:px-6 text-center py-16">
              <p className="text-muted-foreground text-sm">No listings yet.</p>
              <Link href="/dashboard/new" className="mt-4 inline-block">
                <Button size="sm" variant="outline">Add the first listing</Button>
              </Link>
            </div>
          )}
      </div>
    </div>
  );
}
