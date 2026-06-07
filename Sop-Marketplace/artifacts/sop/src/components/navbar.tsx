import { Link, useLocation } from "wouter";
import { useClerk, Show } from "@clerk/react";
import { Search, PlusSquare, LayoutDashboard, ShoppingBag, LogOut, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function Navbar() {
  const [location] = useLocation();
  const { signOut } = useClerk();

  const isActive = (path: string) => location === path;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" data-testid="link-logo">
            <div className="flex items-center gap-2 select-none">
              <img src={`${basePath}/logo.svg`} alt="Sop" className="h-7 w-auto" />
            </div>
          </Link>

          {/* Search bar */}
          <Link href="/search" className="hidden sm:flex flex-1 max-w-md" data-testid="link-search-bar">
            <div className="flex w-full items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors cursor-pointer">
              <Search className="h-4 w-4 shrink-0" />
              <span>Search listings...</span>
            </div>
          </Link>

          {/* Actions */}
          <nav className="flex items-center gap-1">
            <Link href="/search" className="sm:hidden" data-testid="link-search-mobile">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Search className="h-4 w-4" />
              </Button>
            </Link>

            <Show when="signed-in">
              <>
                <Link href="/dashboard/new" data-testid="link-new-listing">
                  <Button variant="ghost" size="icon" className="h-9 w-9" title="Sell">
                    <PlusSquare className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/dashboard" data-testid="link-dashboard">
                  <Button
                    variant={isActive("/dashboard") ? "secondary" : "ghost"}
                    size="icon"
                    className="h-9 w-9"
                    title="Dashboard"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/orders" data-testid="link-orders">
                  <Button
                    variant={isActive("/orders") ? "secondary" : "ghost"}
                    size="icon"
                    className="h-9 w-9"
                    title="Orders"
                  >
                    <ShoppingBag className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  title="Sign out"
                  onClick={() => signOut({ redirectUrl: basePath || "/" })}
                  data-testid="button-sign-out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            </Show>

            <Show when="signed-out">
              <Link href="/sign-in" data-testid="link-sign-in">
                <Button variant="secondary" size="sm" className="gap-1.5">
                  <LogIn className="h-3.5 w-3.5" />
                  Sign in
                </Button>
              </Link>
            </Show>
          </nav>
        </div>
      </div>
    </header>
  );
}
