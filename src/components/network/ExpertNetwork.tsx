import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import GlassCard from "../ui/GlassCard";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Expert {
  id: string;
  firstName: string;
  lastName: string;
  designation: string;
  expertise: string;
  workExperience: string;
  currentOrganization: string;
  location: string;
  areasOfHelp: string;
}

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
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string>("All");
  const [activeExpert, setActiveExpert] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExperts = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/experts/profiles');
        if (!response.ok) {
          throw new Error('Failed to fetch expert profiles');
        }
        const result = await response.json();
        if (result.success) {
          setExperts(result.data);
        } else {
          throw new Error(result.message || 'Failed to load expert profiles');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load expert profiles');
      } finally {
        setLoading(false);
      }
    };

    fetchExperts();
  }, []);



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
      {loading ? (
        <div className="text-center py-8">
          <p>Loading expert profiles...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          <p>{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {experts.slice(0, 6).map((expert) => (
            <GlassCard
              key={expert.id}
              className={cn(
                "p-6 transition-all duration-300",
                activeExpert === expert.id && "ring-2 ring-primary"
              )}
              onClick={() => setActiveExpert(expert.id === activeExpert ? null : expert.id)}
            >
              <div className="flex flex-col items-center text-center p-2">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-3xl font-semibold text-primary mb-4 border-2 border-primary/20">
                  {expert.firstName[0]}{expert.lastName[0]}
                </div>
                
                <div className="w-full">
                  <h3 className="font-display font-semibold text-xl mb-1">{expert.firstName} {expert.lastName}</h3>
                  <p className="text-sm text-primary/80 font-medium mb-4">{expert.designation}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6 text-left">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Expertise</p>
                      <p className="text-sm font-medium truncate">{expert.expertise}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Experience</p>
                      <p className="text-sm font-medium">{expert.workExperience} years</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Organization</p>
                      <p className="text-sm font-medium truncate">{expert.currentOrganization}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Location</p>
                      <p className="text-sm font-medium truncate">{expert.location}</p>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline"
                    className="w-full bg-white/50 hover:bg-white/80 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.scrollTo({top: 0, behavior: 'smooth'});
                      navigate(`/experts/${expert.id}`); // Make sure this matches the route parameter
                    }}
                  >
                    View Full Profile
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

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
