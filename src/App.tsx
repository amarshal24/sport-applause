import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import AccessibilityToolbar from "@/components/AccessibilityToolbar";
import QuickNavMenu from "@/components/QuickNavMenu";
import { lazyWithRetry as lazy } from "@/lib/lazyWithRetry";


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
            <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/games" element={<Games />} />
              <Route path="/motivation" element={<MotivationQuotes />} />
              <Route path="/editor" element={<VideoEditor />} />
              <Route path="/animation-center" element={<VideoEditor />} />
              <Route path="/recruiting" element={<Recruiting />} />
              <Route path="/podcasts" element={<Podcasts />} />
              <Route path="/live" element={<LiveStreams />} />
              <Route path="/live/replay/:streamId" element={<StreamReplay />} />
              <Route path="/trending" element={<Trending />} />
              <Route path="/fans" element={<Fans />} />
              <Route path="/top-plays" element={<TopPlays />} />
              <Route path="/watch-later" element={<WatchLater />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/athlete/:userId" element={<AthleteProfile />} />
              <Route path="/recruiter-dashboard" element={<RecruiterDashboard />} />
              <Route path="/search" element={<Search />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/checkout/return" element={<CheckoutReturn />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <QuickNavMenu />
          <AccessibilityToolbar />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
