// import { useEffect, useRef, useState } from "react";
// import { cn } from "@/lib/utils";
// import GlassCard from "../ui/GlassCard";
// import { Button } from "@/components/ui/button";
// import { useNavigate } from "react-router-dom";

// interface Expert {
//   id: string;
//   firstName: string;
//   lastName: string;
//   designation: string;
//   expertise: string;
//   workExperience: string;
//   currentOrganization: string;
//   location: string;
//   areasOfHelp: string;
// }

// const industries = [
//   "Business strategy & Growth",
//   "HR & Workforce Solutions",
//   "Operations & Manufacturing",
//   "Automation & Workflow",
//   "Marketing & Brand Positioning",
//   "Financial & Risk Advisory",
//   "Digital Transformation & IT",
//   "Customer Support Excellence",
//   "Quality Assurance",
//   "Supply Chain Management",
//   "Research & Development",
// ];

// const ExpertNetwork = () => {
//   const scrollRef = useRef<HTMLDivElement>(null);
//   const [experts, setExperts] = useState<Expert[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [selectedIndustry, setSelectedIndustry] = useState<string>("All");
//   const [activeExpert, setActiveExpert] = useState<string | null>(null);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchExperts = async () => {
//       try {
//         const response = await fetch('http://localhost:5000/api/experts/profiles');
//         if (!response.ok) {
//           throw new Error('Failed to fetch expert profiles');
//         }
//         const result = await response.json();
//         if (result.success) {
//           setExperts(result.data);
//         } else {
//           throw new Error(result.message || 'Failed to load expert profiles');
//         }
//       } catch (err) {
//         setError(err instanceof Error ? err.message : 'Failed to load expert profiles');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchExperts();
//   }, []);



//   // Horizontal scrolling for industries
//   const scrollLeft = () => {
//     if (scrollRef.current) {
//       scrollRef.current.scrollBy({ left: -400, behavior: "smooth" });
//     }
//   };

//   const scrollRight = () => {
//     if (scrollRef.current) {
//       scrollRef.current.scrollBy({ left: 400, behavior: "smooth" });
//     }
//   };

//   return (
//     <section id="network" className="section-container relative z-10">
//       <div className="text-center mb-16">
//         <span className="badge badge-purple mb-4">Expert Network</span>
//         <h2 className="section-title">
//         Guiding You Towards Success: <span className="text-gradient"> Your Path to Achievement Starts Here</span>
//         </h2>
//         <p className="section-subtitle mx-auto">
//         Unleashing Expertise: Your Ultimate Source for Expert Guidance
//         </p>
//       </div>

//       {/* Industry Selection */}
//       <div className="relative mb-10">
//         <button 
//           onClick={scrollLeft}
//           className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-sm hidden md:block"
//           aria-label="Scroll left"
//         >
//           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//           </svg>
//         </button>
        
//         <div 
//           ref={scrollRef}
//           className="flex space-x-3 overflow-x-auto pb-2 px-4 scrollbar-hide snap-x"
//         >
//           <button
//             onClick={() => setSelectedIndustry("All")}
//             className={cn(
//               "px-5 py-2 rounded-full whitespace-nowrap transition-all snap-start",
//               selectedIndustry === "All"
//                 ? "bg-primary text-white shadow-sm"
//                 : "bg-secondary hover:bg-secondary/80"
//             )}
//           >
//             All Services
//           </button>
          
//           {industries.map((industry) => (
//             <button
//               key={industry}
//               onClick={() => setSelectedIndustry(industry)}
//               className={cn(
//                 "px-5 py-2 rounded-full whitespace-nowrap transition-all snap-start",
//                 selectedIndustry === industry
//                   ? "bg-primary text-white shadow-sm"
//                   : "bg-secondary hover:bg-secondary/80"
//               )}
//             >
//               {industry}
//             </button>
//           ))}
//         </div>
        
//         <button 
//           onClick={scrollRight}
//           className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-sm hidden md:block"
//           aria-label="Scroll right"
//         >
//           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//           </svg>
//         </button>
//       </div>

//       {/* Expert Profiles */}
//       {loading ? (
//         <div className="text-center py-8">
//           <p>Loading expert profiles...</p>
//         </div>
//       ) : error ? (
//         <div className="text-center py-8 text-red-500">
//           <p>{error}</p>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {experts.slice(0, 6).map((expert) => (
//             <GlassCard
//               key={expert.id}
//               className={cn(
//                 "p-6 transition-all duration-300",
//                 activeExpert === expert.id && "ring-2 ring-primary"
//               )}
//               onClick={() => setActiveExpert(expert.id === activeExpert ? null : expert.id)}
//             >
//               <div className="flex flex-col items-center text-center p-2">
//                 <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-3xl font-semibold text-primary mb-4 border-2 border-primary/20">
//                   {expert.firstName[0]}{expert.lastName[0]}
//                 </div>
                
//                 <div className="w-full">
//                   <h3 className="font-display font-semibold text-xl mb-1">{expert.firstName} {expert.lastName}</h3>
//                   <p className="text-sm text-primary/80 font-medium mb-4">{expert.designation}</p>
                  
//                   <div className="grid grid-cols-2 gap-4 mb-6 text-left">
//                     <div className="space-y-1">
//                       <p className="text-xs text-muted-foreground uppercase tracking-wider">Expertise</p>
//                       <p className="text-sm font-medium truncate">{expert.expertise}</p>
//                     </div>
                    
//                     <div className="space-y-1">
//                       <p className="text-xs text-muted-foreground uppercase tracking-wider">Experience</p>
//                       <p className="text-sm font-medium">{expert.workExperience} years</p>
//                     </div>

//                     <div className="space-y-1">
//                       <p className="text-xs text-muted-foreground uppercase tracking-wider">Organization</p>
//                       <p className="text-sm font-medium truncate">{expert.currentOrganization}</p>
//                     </div>

//                     <div className="space-y-1">
//                       <p className="text-xs text-muted-foreground uppercase tracking-wider">Location</p>
//                       <p className="text-sm font-medium truncate">{expert.location}</p>
//                     </div>
//                   </div>
                  
//                   <Button 
//                     variant="outline"
//                     className="w-full bg-white/50 hover:bg-white/80 transition-colors"
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       window.scrollTo({top: 0, behavior: 'smooth'});
//                       navigate(`/experts/${expert.id}`); // Make sure this matches the route parameter
//                     }}
//                   >
//                     View Full Profile
//                   </Button>
//                 </div>
//               </div>
//             </GlassCard>
//           ))}
//         </div>
//       )}

//       {/* Call to action */}
//       <div className="mt-12 text-center">
//         <p className="text-muted-foreground mb-4">
//           Discover more specialists from our network of over 300 experts
//         </p>
//         <button className="btn-primary">
//           Browse All Experts
//         </button>
//       </div>
//     </section>
//   );
  
// };

// export default ExpertNetwork;
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);
import BusinessStrategy from "@/img/network/1.jpg";
import Manu from "@/img/network/3.jpg";
import Digital from "@/img/network/4.jpg"; 
import Financial from "@/img/network/5.jpg";

const industries = [
  "Business Strategy & Growth",
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

// Data for each industry
const industryData = {
  "Business Strategy & Growth": {
    about: "Life-changing strategies for business growth",
    consultingHours: "N/A",
    expertLevel: "VP-level experts with 25+ years of experience",
    projectsDelivered: "N/A",
    totalExperts: "N/A", // Add total experts here
  },
  "HR & Workforce Solutions": {
    about: "Optimizing workforce efficiency and engagement",
    consultingHours: "N/A",
    expertLevel: "HR Directors with 20+ years of experience",
    projectsDelivered: "N/A",
    totalExperts: "N/A", // Add total experts here
  },
  "Operations & Manufacturing": {
    about: "Streamlining operations for maximum efficiency",
    consultingHours: "N/A",
    expertLevel: "Operations Managers with 25+ years of experience",
    projectsDelivered: "N/A",
    totalExperts: "N/A", // Add total experts here
  },
  "Automation & Workflow": {
    about: "Streamlining operations with cutting-edge automation",
    consultingHours: "N/A",
    expertLevel: "Senior Managers with 20+ years of experience",
    projectsDelivered: "N/A",
    totalExperts: "N/A", // Add total experts here
  },
  "Marketing & Brand Positioning": {
    about: "Crafting compelling narratives for brands",
    consultingHours: "N/A",
    expertLevel: "Marketing Directors with 20+ years of experience",
    projectsDelivered: "N/A",
    totalExperts: "N/A", // Add total experts here
  },
  "Financial & Risk Advisory": {
    about: "Navigating financial landscapes with expertise",
    consultingHours: "N/A",
    expertLevel: "CFOs with 25+ years of experience",
    projectsDelivered: "N/A",
    totalExperts: "N/A", // Add total experts here
  },
  "Digital Transformation & IT": {
    about: "Transforming businesses through technology",
    consultingHours: "N/A",
    expertLevel: "CTOs with 20+ years of experience",
    projectsDelivered: "N/A",
    totalExperts: "N/A", // Add total experts here
  },
  "Customer Support Excellence": {
    about: "Enhancing customer satisfaction through support",
    consultingHours: "N/A",
    expertLevel: "Customer Support Managers with 20+ years of experience",
    projectsDelivered: "N/A",
    totalExperts: "N/A", // Add total experts here
  },
  "Quality Assurance": {
    about: "Ensuring product quality and reliability",
    consultingHours: "N/A",
    expertLevel: "QA Managers with 20+ years of experience",
    projectsDelivered: "N/A",
    totalExperts: "N/A", // Add total experts here
  },
  "Supply Chain Management": {
    about: "Optimizing supply chain efficiency and effectiveness",
    consultingHours: "N/A",
    expertLevel: "Supply Chain Managers with 20+ years of experience",
    projectsDelivered: "N/A",
    totalExperts: "N/A", // Add total experts here
  },
  "Research & Development": {
    about: "Innovating for the future through research",
    consultingHours: "N/A",
    expertLevel: "R&D Managers with 20+ years of experience",
    projectsDelivered: "N/A",
    totalExperts: "N/A", // Add total experts here
  },
  "All": {
    about: "Comprehensive expertise across all domains",
    consultingHours: 520,
    expertLevel: "Tier 1-level experts from various industries",
    projectsDelivered: 200,
    totalExperts: "300+", // Add total experts here
  },
};

const ExpertNetwork = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string>("All");

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

  const data = industryData[selectedIndustry] || industryData["All"];

  // Chart data
  const chartData = {
    labels: ["Consulting Hours", "Projects Delivered"],
    datasets: [
      {
        label: selectedIndustry,
        data: [data.consultingHours, data.projectsDelivered],
        backgroundColor: ["#8B5CF6", "#34D399"],
        borderColor: ["#7C3AED", "#059669"],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
  };

  return (
    <section id="network" className="section-container relative z-10">
      <div className="text-center mb-16">
        <span className="badge badge-purple mb-4">Expert Network</span>
        <h2 className="section-title">
          Guiding You Towards Success:{" "}
          <span className="text-gradient">Your Path to Achievement Starts Here</span>
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

      {/* Single Card for Selected Industry */}
      <motion.div
        className="flex justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-8 bg-white shadow-lg rounded-lg w-full max-w-4xl h-[400px] flex flex-col md:flex-row items-center gap-8">
          {/* Left Side: Written Content */}
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-center md:text-left mb-6">{selectedIndustry}</h3>
            <p className="text-base text-muted-foreground mb-4">
              <strong>About:</strong> {data.about}
            </p>
            <p className="text-base text-muted-foreground mb-4">
              <strong>Total Experts:</strong> {data.totalExperts}
            </p>
            <p className="text-base text-muted-foreground mb-4">
              <strong>Total Consulting Hours:</strong> {data.consultingHours.toLocaleString()}
            </p>
            <p className="text-base text-muted-foreground mb-4">
              <strong>Expert Level:</strong> {data.expertLevel}
            </p>
            <p className="text-base text-muted-foreground mb-6">
              <strong>Projects Delivered:</strong> {data.projectsDelivered.toLocaleString()}
            </p>
          </div>

          {/* Right Side: Custom Visualization */}
          <div className="flex-1 flex justify-center items-center h-full">
            {selectedIndustry === "Business Strategy & Growth" ? (
              <div className="w-full h-full flex justify-center items-center">
                <img
                  src= {BusinessStrategy} // Replace with the actual path to your image
                  alt="Business Strategy & Growth"
                  className="rounded-lg shadow-lg w-full h-auto max-w-sm"
                />
              </div>
            ) : selectedIndustry === "HR & Workforce Solutions" ? (
              <div className="w-full h-full flex justify-center items-center">
                <Pie
                  data={{
                    labels: ["Employee Engagement", "Talent Acquisition", "Training & Development", "Retention Strategies"],
                    datasets: [
                      {
                        data: [40, 30, 20, 10],
                        backgroundColor: ["#4F46E5", "#10B981", "#FBBF24", "#EF4444"],
                        borderColor: ["#4338CA", "#059669", "#D97706", "#DC2626"],
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: "bottom",
                      },
                    },
                  }}
                  width={150} // Adjust the width of the pie chart
                  height={150} // Adjust the height of the pie chart
                />
              </div>
            ) : selectedIndustry === "Operations & Manufacturing" ? (
              <div className="w-full h-full flex justify-center items-center">
                <Pie
                  data={{
                    labels: ["Process Optimization", "Supply Chain Management", "Quality Control", "Cost Reduction"],
                    datasets: [
                      {
                        data: [35, 25, 20, 20],
                        backgroundColor: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"],
                        borderColor: ["#2563EB", "#059669", "#D97706", "#DC2626"],
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: "bottom",
                      },
                    },
                  }}
                  width={150} // Adjust the width of the pie chart
                  height={150} // Adjust the height of the pie chart
                />
              </div>
              ) : selectedIndustry === "Digital Transformation & IT" ? (
                <div className="w-full h-full flex justify-center items-center">
                  <img
                    src={Digital} // Path to the Digital Transformation & IT image
                    alt="Digital Transformation & IT"
                    className="rounded-lg shadow-lg w-full h-auto max-w-sm"
                  />
                </div>
              ) : selectedIndustry === "Financial & Risk Advisory" ? (
                <div className="w-full h-full flex justify-center items-center">
                  <img
                    src={Financial} // Path to the Financial & Risk Advisory image
                    alt="Financial & Risk Advisory"
                    className="rounded-lg shadow-lg w-full h-auto max-w-sm object-cover" // Added object-cover for consistent sizing
                    style={{ maxWidth: "300px", height: "300px" }} // Enforcing consistent size
                  />
                </div>
              ):selectedIndustry === "Supply Chain Management"?(
                <div className="w-full h-full flex justify-center items-center">
                  <img
                    src={Manu} // Path to the Supply Chain Management image
                    alt="Supply Chain Management"
                    className="rounded-lg shadow-lg w-full h-auto max-w-sm object-cover" // Added object-cover for consistent sizing
                    style={{ maxWidth: "400px", height: "230px" }} // Enforcing consistent size
                  />
                </div>
            ) : (
              <div className="w-full h-full flex justify-center items-center">
                <Bar
                  data={chartData}
                  options={{
                    ...chartOptions,
                    maintainAspectRatio: true,
                  }}
                  height={150} // Adjust the height of the bar chart
                />
              </div>
            )}
          </div>
        </div>
      </motion.div>

    </section>
  );
};

export default ExpertNetwork;