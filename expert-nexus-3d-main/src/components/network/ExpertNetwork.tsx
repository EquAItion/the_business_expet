
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import GlassCard from "../ui/GlassCard";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

// Mock expert data
const experts = [
  {
    id: "1",
    name: "Dr. Emma Thompson",
    role: "AI Research Specialist",
    area: "Artificial Intelligence",
    experience: "12+ years",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  },
  {
    id: "2",
    name: "Michael Chen",
    role: "Financial Analyst",
    area: "Investment Banking",
    experience: "15+ years",
    image: "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  },
  {
    id: "3",
    name: "Dr. Sarah Johnson",
    role: "Biotech Consultant",
    area: "Biotechnology",
    experience: "20+ years",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  },
  {
    id: "4",
    name: "James Wilson",
    role: "Marketing Director",
    area: "Digital Marketing",
    experience: "10+ years",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  },
  {
    id: "5",
    name: "Sophia Rodriguez",
    role: "UX Research Lead",
    area: "Product Design",
    experience: "8+ years",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  },
];

const industries = [
  "Business strategy & Growth",
  "HR & Workforce Solutions",
  "Operations & Manufacturing",
  "Automation & Workflow",
  "Marketing & Brand Positioning",
  "Financial & Risk Advisory",
  "Digital Transformation & IT",
  "Customer Support Excellence",
  "Quality Assurance",
  "Supply Chain Management",
  "Research & Development",
];

const ExpertNetwork = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string>("All");
  const [activeExpert, setActiveExpert] = useState<string | null>(null);
  const navigate = useNavigate();

  // Horizontal scrolling for industries
  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -400, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 400, behavior: "smooth" });
    }
  };

  return (
    <section id="network" className="section-container relative z-10">
      <div className="text-center mb-16">
        <span className="badge badge-purple mb-4">Expert Network</span>
        <h2 className="section-title">
        Guiding You Towards Success: <span className="text-gradient"> Your Path to Achievement Starts Here</span>
        </h2>
        <p className="section-subtitle mx-auto">
        Unleashing Expertise: Your Ultimate Source for Expert Guidance
        </p>
      </div>

      {/* Industry Selection */}
      <div className="relative mb-10">
        <button 
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-sm hidden md:block"
          aria-label="Scroll left"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div 
          ref={scrollRef}
          className="flex space-x-3 overflow-x-auto pb-2 px-4 scrollbar-hide snap-x"
        >
          <button
            onClick={() => setSelectedIndustry("All")}
            className={cn(
              "px-5 py-2 rounded-full whitespace-nowrap transition-all snap-start",
              selectedIndustry === "All"
                ? "bg-primary text-white shadow-sm"
                : "bg-secondary hover:bg-secondary/80"
            )}
          >
            All Services
          </button>
          
          {industries.map((industry) => (
            <button
              key={industry}
              onClick={() => setSelectedIndustry(industry)}
              className={cn(
                "px-5 py-2 rounded-full whitespace-nowrap transition-all snap-start",
                selectedIndustry === industry
                  ? "bg-primary text-white shadow-sm"
                  : "bg-secondary hover:bg-secondary/80"
              )}
            >
              {industry}
            </button>
          ))}
        </div>
        
        <button 
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-sm hidden md:block"
          aria-label="Scroll right"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Expert Profiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {experts.map((expert) => (
          <GlassCard
            key={expert.id}
            className={cn(
              "p-6 transition-all duration-300",
              activeExpert === expert.id && "ring-2 ring-primary"
            )}
            onClick={() => setActiveExpert(expert.id === activeExpert ? null : expert.id)}
          >
            <div className="flex items-start gap-4">
              <img 
                src={expert.image} 
                alt={expert.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" 
              />
              
              <div>
                <h3 className="font-display font-semibold text-lg">{expert.name}</h3>
                <p className="text-sm text-muted-foreground">{expert.role}</p>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm">
                    <span className="font-medium mr-2">Area:</span>
                    <span>{expert.area}</span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <span className="font-medium mr-2">Experience:</span>
                    <span>{expert.experience}</span>
                  </div>
                </div>
                
                <Button 
                  variant="link"
                  className="mt-4 text-sm font-medium text-primary hover:text-primary/80 transition-colors p-0"
                  onClick={() => navigate(`/expert/${expert.id}`)}
                >
                  View Full Profile
                </Button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Call to action */}
      <div className="mt-12 text-center">
        <p className="text-muted-foreground mb-4">
          Discover more specialists from our network of over 300 experts
        </p>
        <button className="btn-primary">
          Browse All Experts
        </button>
      </div>
    </section>
  );
};

export default ExpertNetwork;
