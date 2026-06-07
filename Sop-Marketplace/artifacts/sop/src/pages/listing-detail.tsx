import { useState } from "react";
import { useRoute, Link } from "wouter";
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, ShoppingCart, AlertCircle } from "lucide-react";
import { useGetListing, getGetListingQueryKey, useCreateCheckout } from "@workspace/api-client-react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Show } from "@clerk/react";

export default function ListingDetailPage() {
  const [, params] = useRoute("/listings/:id");
  const id = params?.id ?? "";
  const [imageIndex, setImageIndex] = useState(0);
  const { toast } = useToast();

  const { data: listing, isLoading } = useGetListing(id, {
    query: { enabled: !!id, queryKey: getGetListingQueryKey(id) },
  });

  const createCheckout = useCreateCheckout();

  function handleBuyNow() {
    if (!listing) return;
    createCheckout.mutate(
      { data: { listingId: listing.id } },
      {
        onSuccess: (result) => {
          if (result.url) {
            window.location.href = result.url;
          }
        },
        onError: (err: any) => {
          toast({
            title: "Checkout failed",
            description: err?.message ?? "Could not start checkout. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="aspect-[3/4] rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-11 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
          <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Listing not found</h2>
          <Link href="/">
            <Button variant="outline" size="sm">Back to home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const images = listing.images && listing.images.length > 0 ? listing.images : [];
  const currentImage = images[imageIndex];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Back */}
        <button
          onClick={() => history.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <div>
            <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-muted">
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={listing.title}
                  className="h-full w-full object-cover"
                  data-testid="img-listing-main"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="text-muted-foreground text-sm">{listing.category}</span>
                </div>
              )}

              {listing.status === "sold" && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-semibold text-lg tracking-widest uppercase">Sold</span>
                </div>
              )}

              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setImageIndex((i) => Math.max(0, i - 1))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 backdrop-blur-sm hover:bg-black/70 transition-colors"
                    data-testid="button-prev-image"
                  >
                    <ChevronLeft className="h-4 w-4 text-white" />
                  </button>
                  <button
                    onClick={() => setImageIndex((i) => Math.min(images.length - 1, i + 1))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 backdrop-blur-sm hover:bg-black/70 transition-colors"
                    data-testid="button-next-image"
                  >
                    <ChevronRight className="h-4 w-4 text-white" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-3">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setImageIndex(i)}
                    className={`h-14 w-14 overflow-hidden rounded-lg border-2 transition-colors ${i === imageIndex ? "border-primary" : "border-transparent opacity-50 hover:opacity-75"}`}
                    data-testid={`button-thumbnail-${i}`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1
                className="text-2xl sm:text-3xl font-bold leading-tight"
                data-testid="text-listing-title"
              >
                {listing.title}
              </h1>
              <Badge
                variant={listing.status === "available" ? "default" : "secondary"}
                className="shrink-0 mt-1"
                data-testid="status-listing"
              >
                {listing.status === "available" ? "Available" : "Sold"}
              </Badge>
            </div>

            <p
              className="text-3xl font-bold text-foreground mb-4"
              data-testid="text-listing-price"
            >
              ${listing.price.toFixed(2)}
            </p>

            <span className="inline-block mb-4 text-xs uppercase tracking-widest text-muted-foreground border border-border rounded-full px-3 py-1 w-fit">
              {listing.category}
            </span>

            {listing.description && (
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                {listing.description}
              </p>
            )}

            {/* Seller */}
            {listing.seller && (
              <Link href={`/sellers/${listing.sellerId}`} data-testid="link-seller">
                <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 mb-6 hover:border-accent transition-colors cursor-pointer group">
                  {listing.seller.avatarUrl ? (
                    <img
                      src={listing.seller.avatarUrl}
                      alt={listing.seller.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                      {listing.seller.name[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold group-hover:text-white transition-colors">
                      {listing.seller.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {listing.seller.totalListings} listing{listing.seller.totalListings !== 1 ? "s" : ""}
                      {listing.seller.totalSales > 0 && ` · ${listing.seller.totalSales} sale${listing.seller.totalSales !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            )}

            {/* Buy button */}
            {listing.status === "available" ? (
              <>
                <Show when="signed-in">
                  <Button
                    size="lg"
                    className="w-full gap-2 font-semibold"
                    onClick={handleBuyNow}
                    disabled={createCheckout.isPending}
                    data-testid="button-buy-now"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {createCheckout.isPending ? "Preparing checkout..." : "Buy Now"}
                  </Button>
                </Show>
                <Show when="signed-out">
                  <Link href="/sign-in">
                    <Button size="lg" className="w-full gap-2 font-semibold" data-testid="button-sign-in-to-buy">
                      Sign in to buy
                    </Button>
                  </Link>
                </Show>
              </>
            ) : (
              <Button size="lg" className="w-full" disabled data-testid="button-sold">
                Sold
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
