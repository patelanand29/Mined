import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/mood-calendar" element={<MoodCalendar />} />
          <Route path="/mood-trends" element={<MoodTrends />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/emotion-alchemist" element={<EmotionAlchemist />} />
          <Route path="/cbt-tools" element={<CBTTools />} />
          <Route path="/meditation" element={<Meditation />} />
          <Route path="/community" element={<Community />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/counsellors" element={<Counsellors />} />
          <Route path="/time-capsule" element={<TimeCapsule />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
