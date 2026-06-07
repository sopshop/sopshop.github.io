import { useRoute } from "wouter";
import { Calendar, Package, ShoppingBag, AlertCircle } from "lucide-react";
import { useGetSeller, getGetSellerQueryKey, useGetSellerListings, getGetSellerListingsQueryKey } from "@workspace/api-client-react";
import { Navbar } from "@/components/navbar";
import { ListingCard } from "@/components/listing-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SellerPage() {
  const [, params] = useRoute("/sellers/:id");
  const id = params?.id ?? "";

  const { data: seller, isLoading: loadingSeller } = useGetSeller(id, {
    query: { enabled: !!id, queryKey: getGetSellerQueryKey(id) },
  });

  const { data: listings, isLoading: loadingListings } = useGetSellerListings(id, {
    query: { enabled: !!id, queryKey: getGetSellerListingsQueryKey(id) },
  });

  const joinedDate = seller?.createdAt
    ? new Date(seller.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Seller profile */}
        {loadingSeller ? (
          <div className="flex gap-4 items-start mb-10">
            <Skeleton className="h-20 w-20 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ) : seller ? (
          <div className="mb-10">
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              {seller.avatarUrl ? (
                <img
                  src={seller.avatarUrl}
                  alt={seller.name}
                  className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover border-2 border-border shrink-0"
                  data-testid="img-seller-avatar"
                />
              ) : (
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground border-2 border-border shrink-0">
                  {seller.name[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-2xl font-bold" data-testid="text-seller-name">{seller.name}</h1>
                {seller.bio && (
                  <p className="text-sm text-muted-foreground mt-1 max-w-lg">{seller.bio}</p>
                )}
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5" data-testid="text-seller-listings">
                    <Package className="h-3.5 w-3.5" />
                    {seller.totalListings} listing{seller.totalListings !== 1 ? "s" : ""}
                  </span>
                  {seller.totalSales > 0 && (
                    <span className="flex items-center gap-1.5" data-testid="text-seller-sales">
                      <ShoppingBag className="h-3.5 w-3.5" />
                      {seller.totalSales} sale{seller.totalSales !== 1 ? "s" : ""}
                    </span>
                  )}
                  {joinedDate && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Joined {joinedDate}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-24 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold">Seller not found</h2>
          </div>
        )}

        {/* Listings grid */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">Listings</h2>
          {loadingListings ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
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
            <div className="text-center py-16 text-muted-foreground text-sm">
              No listings yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
