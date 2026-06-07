import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useListListings, useListCategories } from "@workspace/api-client-react";
import { Navbar } from "@/components/navbar";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

function parseSearch(search: string) {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return {
    category: params.get("category") ?? "",
    keyword: params.get("q") ?? "",
  };
}

export default function SearchPage() {
  const [location] = useLocation();
  const initial = parseSearch(window.location.search);

  const [keyword, setKeyword] = useState(initial.keyword);
  const [debouncedKeyword, setDebouncedKeyword] = useState(initial.keyword);
  const [category, setCategory] = useState(initial.category);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [status, setStatus] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Debounce keyword
  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword), 400);
    return () => clearTimeout(t);
  }, [keyword]);

  const queryParams: Record<string, any> = {};
  if (debouncedKeyword) queryParams.keyword = debouncedKeyword;
  if (category) queryParams.category = category;
  if (priceMin) queryParams.priceMin = Number(priceMin);
  if (priceMax) queryParams.priceMax = Number(priceMax);
  if (status) queryParams.status = status;

  const { data: listings, isLoading } = useListListings(
    Object.keys(queryParams).length > 0 ? queryParams : undefined
  );
  const { data: categories } = useListCategories();

  const hasFilters = !!(category || priceMin || priceMax || status);

  function clearFilters() {
    setCategory("");
    setPriceMin("");
    setPriceMax("");
    setStatus("");
  }

  const FilterControls = () => (
    <div className="space-y-5">
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Category</label>
        <Select value={category || "all"} onValueChange={(v) => setCategory(v === "all" ? "" : v)}>
          <SelectTrigger className="w-full" data-testid="select-category">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c.category} value={c.category}>{c.category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Price</label>
        <div className="flex gap-2">
          <Input
            placeholder="Min"
            type="number"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            className="flex-1"
            data-testid="input-price-min"
          />
          <Input
            placeholder="Max"
            type="number"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="flex-1"
            data-testid="input-price-max"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Status</label>
        <Select value={status || "any"} onValueChange={(v) => setStatus(v === "any" ? "" : v)}>
          <SelectTrigger className="w-full" data-testid="select-status">
            <SelectValue placeholder="Any status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full text-muted-foreground" data-testid="button-clear-filters">
          <X className="h-3.5 w-3.5 mr-1.5" />
          Clear filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Search bar + filter toggle */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search listings..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              data-testid="input-search"
            />
          </div>
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 relative" data-testid="button-filters">
                <SlidersHorizontal className="h-4 w-4" />
                {hasFilters && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-primary" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-card border-border">
              <SheetHeader className="mb-6">
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <FilterControls />
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex gap-6">
          {/* Sidebar filters (desktop) */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-20 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Filters</h3>
                {hasFilters && (
                  <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
                )}
              </div>
              <FilterControls />
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground" data-testid="text-results-count">
                {isLoading ? "Searching..." : `${listings?.length ?? 0} listing${listings?.length !== 1 ? "s" : ""}`}
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="aspect-[3/4] rounded-xl mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-1" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : listings && listings.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <div className="text-center py-24">
                <p className="text-muted-foreground text-sm">No listings found.</p>
                <p className="text-xs text-muted-foreground mt-1 opacity-60">Try adjusting your filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
