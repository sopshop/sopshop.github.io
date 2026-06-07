import { useState } from "react";
import { Link } from "wouter";
import { Plus, Pencil, Trash2, Package, ShoppingBag } from "lucide-react";
import {
  useGetMyListings,
  getGetMyListingsQueryKey,
  useDeleteListing,
  useGetMySales,
  getGetMySalesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function DashboardPage() {
  const { data: listings, isLoading: loadingListings } = useGetMyListings();
  const { data: sales } = useGetMySales({ query: { queryKey: getGetMySalesQueryKey() } });
  const deleteListing = useDeleteListing();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function handleDelete() {
    if (!deleteId) return;
    deleteListing.mutate(
      { id: deleteId },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetMyListingsQueryKey() });
          toast({ title: "Listing deleted" });
          setDeleteId(null);
        },
        onError: () => {
          toast({ title: "Failed to delete listing", variant: "destructive" });
          setDeleteId(null);
        },
      }
    );
  }

  const activeCount = listings?.filter((l) => l.status === "available").length ?? 0;
  const soldCount = listings?.filter((l) => l.status === "sold").length ?? 0;
  const totalRevenue = sales?.reduce((sum, s) => sum + s.amount, 0) ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your listings and sales</p>
          </div>
          <Link href="/dashboard/new" data-testid="button-add-listing">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add listing
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="rounded-xl border border-border bg-card p-4" data-testid="stat-active">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Active</span>
            </div>
            <p className="text-2xl font-bold">{activeCount}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4" data-testid="stat-sold">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Sold</span>
            </div>
            <p className="text-2xl font-bold">{soldCount}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4" data-testid="stat-revenue">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Revenue</span>
            </div>
            <p className="text-2xl font-bold">${totalRevenue.toFixed(0)}</p>
          </div>
        </div>

        {/* Listings */}
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">Your listings</h2>

        {loadingListings ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3 rounded-xl border border-border bg-card p-3">
                <Skeleton className="h-16 w-16 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : listings && listings.length > 0 ? (
          <div className="space-y-2">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:border-accent transition-colors"
                data-testid={`row-listing-${listing.id}`}
              >
                {/* Image */}
                <div className="h-14 w-14 rounded-lg overflow-hidden bg-muted shrink-0">
                  {listing.images?.[0] ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                      ○
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{listing.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-semibold">${listing.price.toFixed(2)}</span>
                    <Badge
                      variant={listing.status === "available" ? "default" : "secondary"}
                      className="text-xs px-1.5 py-0 h-4"
                    >
                      {listing.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{listing.category}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 shrink-0">
                  <Link href={`/dashboard/listings/${listing.id}/edit`} data-testid={`button-edit-${listing.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteId(listing.id)}
                    data-testid={`button-delete-${listing.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border py-16 text-center">
            <Package className="h-8 w-8 mx-auto text-muted-foreground mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">No listings yet.</p>
            <Link href="/dashboard/new" className="mt-4 inline-block">
              <Button variant="outline" size="sm">Create your first listing</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
