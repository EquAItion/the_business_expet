
import HeroSection from "@/components/hero/HeroSection";
import ExpertNetwork from "@/components/network/ExpertNetwork";
import FeatureCards from "@/components/features/FeatureCards";
import InsightsVisualization from "@/components/insights/InsightsVisualization";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AIChat from "@/components/AIChat";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      
      <div className="relative">
        {/* Background decoration - subtle grid */}
        <div className="absolute inset-0 bg-[linear-gradient(#f9fafb_2px,transparent_2px),linear-gradient(90deg,#f9fafb_2px,transparent_2px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none -z-10" />
        
        <ExpertNetwork />
        <FeatureCards />
        <InsightsVisualization />
        <AIChat />
      </div>
      
      <Footer />
    </div>
  );
};

export default Index;
