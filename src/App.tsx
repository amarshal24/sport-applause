import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import AccessibilityToolbar from "@/components/AccessibilityToolbar";
import QuickNavMenu from "@/components/QuickNavMenu";

// Lazy load pages for faster initial load
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const Games = lazy(() => import("./pages/Games"));
const MotivationQuotes = lazy(() => import("./pages/MotivationQuotes"));
const VideoEditor = lazy(() => import("./pages/VideoEditor"));
const Recruiting = lazy(() => import("./pages/Recruiting"));
const Podcasts = lazy(() => import("./pages/Podcasts"));
const LiveStreams = lazy(() => import("./pages/LiveStreams"));
const Trending = lazy(() => import("./pages/Trending"));
const Discover = lazy(() => import("./pages/Discover"));
const Following = lazy(() => import("./pages/Following"));
const TopPlays = lazy(() => import("./pages/TopPlays"));
const WatchLater = lazy(() => import("./pages/WatchLater"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Messages = lazy(() => import("./pages/Messages"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/games" element={<Games />} />
              <Route path="/motivation" element={<MotivationQuotes />} />
              <Route path="/editor" element={<VideoEditor />} />
              <Route path="/recruiting" element={<Recruiting />} />
              <Route path="/podcasts" element={<Podcasts />} />
              <Route path="/live" element={<LiveStreams />} />
              <Route path="/trending" element={<Trending />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/following" element={<Following />} />
              <Route path="/top-plays" element={<TopPlays />} />
              <Route path="/watch-later" element={<WatchLater />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/messages" element={<Messages />} />
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
