import { Link } from "wouter";
import { CheckCircle, ShoppingBag, Home } from "lucide-react";
import { useCheckoutSuccess } from "@workspace/api-client-react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function CheckoutSuccessPage() {
  const sessionId = new URLSearchParams(window.location.search).get("session_id") ?? "";

  const { data: order, isLoading } = useCheckoutSuccess(
    { session_id: sessionId },
    { query: { enabled: !!sessionId } }
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-md mx-auto px-4 sm:px-6 py-16 text-center">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-16 rounded-full mx-auto" />
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center mb-6">
              <div className="rounded-full bg-primary/10 p-5">
                <CheckCircle className="h-12 w-12 text-primary" />
              </div>
            </div>

            <h1 className="text-2xl font-bold mb-2" data-testid="text-success-title">Order confirmed</h1>
            <p className="text-sm text-muted-foreground mb-8">
              {order
                ? `You purchased "${order.listingTitle}" for $${order.amount.toFixed(2)}.`
                : "Your payment was successful."}
            </p>

            {order && (
              <div className="rounded-xl border border-border bg-card p-4 mb-8 text-left">
                <div className="flex items-center gap-3">
                  {order.listingImage && (
                    <img
                      src={order.listingImage}
                      alt={order.listingTitle}
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <p className="text-sm font-medium" data-testid="text-order-title">{order.listingTitle}</p>
                    <p className="text-sm text-muted-foreground mt-0.5" data-testid="text-order-amount">
                      ${order.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Link href="/orders">
                <Button className="w-full gap-2" data-testid="button-view-orders">
                  <ShoppingBag className="h-4 w-4" />
                  View orders
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full gap-2" data-testid="button-home">
                  <Home className="h-4 w-4" />
                  Back to home
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
