import { Link } from "wouter";

interface Listing {
  id: string;
  title: string;
  price: number;
  category: string;
  status: string;
  images: string[];
  sellerName: string;
}

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const image = listing.images?.[0];

  return (
    <Link href={`/listings/${listing.id}`} data-testid={`card-listing-${listing.id}`}>
      <div className="group relative overflow-hidden rounded-xl bg-card border border-border hover:border-accent transition-all duration-300 cursor-pointer">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          {image ? (
            <img
              src={image}
              alt={listing.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <div className="text-center px-4">
                <div className="text-3xl mb-2 opacity-20">○</div>
                <span className="text-xs uppercase tracking-widest opacity-40">{listing.category}</span>
              </div>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 to-transparent" />

          {/* Status badge */}
          {listing.status === "sold" && (
            <div className="absolute top-2 right-2">
              <span className="rounded-md bg-black/70 px-2 py-0.5 text-xs font-medium text-white/60 backdrop-blur-sm border border-white/10">
                Sold
              </span>
            </div>
          )}

          {/* Price */}
          <div className="absolute bottom-2 left-2">
            <span
              className="rounded-md bg-black/60 px-2 py-1 text-sm font-semibold text-white backdrop-blur-sm"
              data-testid={`text-price-${listing.id}`}
            >
              ${listing.price.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-2.5">
          <p
            className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-white transition-colors"
            data-testid={`text-title-${listing.id}`}
          >
            {listing.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {listing.sellerName}
          </p>
        </div>
      </div>
    </Link>
  );
}
