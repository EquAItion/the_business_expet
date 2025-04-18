import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Network from "./pages/Network";
import Products from "./pages/Products";
import Features from "./pages/Features";
import Insights from "./pages/Insights";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import ExpertProfile from "./pages/ExpertProfile";
import SeekerForm from "./components/Auth/SeekerForm";
import ExpertForm from "./components/Auth/ExpertForm";
import ExpertProfileForm from "./components/Auth/ExpertProfileForm";
import SeekerProfileForm from "./components/Auth/SeekerProfileForm";
import Webinar from "./pages/Webinar";
import ExpertDashboard from "./components/dashboard/ExpertDashboard";
import About from "./components/About/About";
import WebinarSection from "./components/webinar/WebinarSection";
import ProductShowcase from "./components/products/ProductShowcase";
import Onboarding from "./pages/Onboarding";
import AIdashboard from "./pages/AIdashboard";
import SeekerDashboard from "./components/dashboard/SeekerDashbord";



const queryClient = new QueryClient();
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/network" element={<Network />} />
         <Route path="/experts/:id" element={<ExpertProfile />} />
          <Route path="/features" element={<Features />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/aidashboard" element={<AIdashboard />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/auth/seeker" element={<SeekerForm />} />
          <Route path="/auth/expert" element={<ExpertForm />} />
          <Route path="/auth/ExpertProfileForm" element={<ExpertProfileForm />} />
          <Route path="/auth/SeekerProfileForm" element={<SeekerProfileForm />} />
          <Route path="/webinar" element={<Webinar />} />
          <Route path="/webinarsection" element={<WebinarSection />} />
          <Route path="/products" element={<Products />} />
          <Route path="/productshowcase" element={<ProductShowcase />} />
          <Route path="/dashboard" element={<ExpertDashboard />} />
          <Route path="/seekerdashboard" element={<SeekerDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
