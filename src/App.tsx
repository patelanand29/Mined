import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import MoodCalendar from "./pages/MoodCalendar";
import MoodTrends from "./pages/MoodTrends";
import Journal from "./pages/Journal";
import EmotionAlchemist from "./pages/EmotionAlchemist";
import CBTTools from "./pages/CBTTools";
import Meditation from "./pages/Meditation";
import Community from "./pages/Community";
import Resources from "./pages/Resources";
import Counsellors from "./pages/Counsellors";
import TimeCapsule from "./pages/TimeCapsule";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/mood-calendar" element={
              <ProtectedRoute>
                <MoodCalendar />
              </ProtectedRoute>
            } />
            <Route path="/mood-trends" element={
              <ProtectedRoute>
                <MoodTrends />
              </ProtectedRoute>
            } />
            <Route path="/journal" element={
              <ProtectedRoute>
                <Journal />
              </ProtectedRoute>
            } />
            <Route path="/emotion-alchemist" element={
              <ProtectedRoute>
                <EmotionAlchemist />
              </ProtectedRoute>
            } />
            <Route path="/cbt-tools" element={<CBTTools />} />
            <Route path="/meditation" element={<Meditation />} />
            <Route path="/community" element={
              <ProtectedRoute>
                <Community />
              </ProtectedRoute>
            } />
            <Route path="/resources" element={<Resources />} />
            <Route path="/counsellors" element={<Counsellors />} />
            <Route path="/time-capsule" element={
              <ProtectedRoute>
                <TimeCapsule />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/help" element={<Help />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
