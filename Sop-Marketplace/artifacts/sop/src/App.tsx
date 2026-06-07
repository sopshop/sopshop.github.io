import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import SearchPage from "@/pages/search";
import ListingDetailPage from "@/pages/listing-detail";
import SellerPage from "@/pages/seller";
import DashboardPage from "@/pages/dashboard";
import CreateListingPage from "@/pages/create-listing";
import EditListingPage from "@/pages/edit-listing";
import OrdersPage from "@/pages/orders";
import CheckoutSuccessPage from "@/pages/checkout-success";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(0 0% 94%)",
    colorForeground: "hsl(0 0% 94%)",
    colorMutedForeground: "hsl(240 4% 58%)",
    colorDanger: "hsl(0 72% 55%)",
    colorBackground: "hsl(240 5% 11%)",
    colorInput: "hsl(240 4% 14%)",
    colorInputForeground: "hsl(0 0% 94%)",
    colorNeutral: "hsl(240 4% 58%)",
    fontFamily: "'Inter', system-ui, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[hsl(240_5%_11%)] rounded-2xl w-[440px] max-w-full overflow-hidden border border-[hsl(240_4%_18%)]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[hsl(0_0%_94%)] font-semibold",
    headerSubtitle: "text-[hsl(240_4%_58%)]",
    socialButtonsBlockButtonText: "text-[hsl(0_0%_85%)]",
    formFieldLabel: "text-[hsl(0_0%_85%)]",
    footerActionLink: "text-[hsl(0_0%_94%)] hover:text-white",
    footerActionText: "text-[hsl(240_4%_58%)]",
    dividerText: "text-[hsl(240_4%_58%)]",
    identityPreviewEditButton: "text-[hsl(0_0%_94%)]",
    formFieldSuccessText: "text-[hsl(160_60%_45%)]",
    alertText: "text-[hsl(0_0%_85%)]",
    logoBox: "mb-2",
    logoImage: "h-8 w-auto",
    socialButtonsBlockButton: "bg-[hsl(240_4%_16%)] border border-[hsl(240_4%_22%)] hover:bg-[hsl(240_4%_20%)]",
    formButtonPrimary: "bg-[hsl(0_0%_94%)] text-[hsl(240_6%_7%)] hover:bg-white font-semibold",
    formFieldInput: "bg-[hsl(240_4%_14%)] border border-[hsl(240_4%_22%)] text-[hsl(0_0%_94%)]",
    footerAction: "border-t border-[hsl(240_4%_18%)]",
    dividerLine: "bg-[hsl(240_4%_18%)]",
    alert: "bg-[hsl(240_4%_14%)] border border-[hsl(240_4%_22%)]",
    otpCodeFieldInput: "bg-[hsl(240_4%_14%)] border border-[hsl(240_4%_22%)] text-[hsl(0_0%_94%)]",
    formFieldRow: "",
    main: "",
  },
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <Show when="signed-in">
        <Component />
      </Show>
      <Show when="signed-out">
        <SignInRedirect />
      </Show>
    </>
  );
}

function SignInRedirect() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/sign-in");
  }, [setLocation]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/listings/:id" component={ListingDetailPage} />
      <Route path="/sellers/:id" component={SellerPage} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/dashboard">
        {() => <ProtectedRoute component={DashboardPage} />}
      </Route>
      <Route path="/dashboard/new">
        {() => <ProtectedRoute component={CreateListingPage} />}
      </Route>
      <Route path="/dashboard/listings/:id/edit">
        {() => <ProtectedRoute component={EditListingPage} />}
      </Route>
      <Route path="/orders">
        {() => <ProtectedRoute component={OrdersPage} />}
      </Route>
      <Route path="/checkout/success" component={CheckoutSuccessPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to your Sop account",
          },
        },
        signUp: {
          start: {
            title: "Join Sop",
            subtitle: "Buy and sell anything",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
