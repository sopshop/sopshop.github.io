import { Link } from "wouter";
import { ShoppingBag, ExternalLink } from "lucide-react";
import { useGetMyOrders, getGetMyOrdersQueryKey } from "@workspace/api-client-react";
import { Navbar } from "@/components/navbar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function OrdersPage() {
  const { data: orders, isLoading } = useGetMyOrders({
    query: { queryKey: getGetMyOrdersQueryKey() },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold mb-2">Orders</h1>
        <p className="text-sm text-muted-foreground mb-8">Items you've purchased.</p>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4 rounded-xl border border-border bg-card p-4">
                <Skeleton className="h-16 w-16 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
                data-testid={`row-order-${order.id}`}
              >
                {/* Image */}
                <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted shrink-0">
                  {order.listingImage ? (
                    <img
                      src={order.listingImage}
                      alt={order.listingTitle}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                      ○
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" data-testid={`text-order-title-${order.id}`}>
                    {order.listingTitle}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-sm font-semibold" data-testid={`text-order-amount-${order.id}`}>
                      ${order.amount.toFixed(2)}
                    </span>
                    <Badge
                      variant={order.status === "completed" ? "default" : "secondary"}
                      className="text-xs h-4 px-1.5 py-0"
                    >
                      {order.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* View listing */}
                <Link href={`/listings/${order.listingId}`} data-testid={`link-order-listing-${order.id}`}>
                  <button className="text-muted-foreground hover:text-foreground transition-colors p-1">
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border py-24 text-center">
            <ShoppingBag className="h-8 w-8 mx-auto text-muted-foreground mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">No orders yet.</p>
            <Link href="/" className="mt-4 inline-block text-sm text-foreground hover:text-white underline underline-offset-4 transition-colors">
              Browse listings
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
