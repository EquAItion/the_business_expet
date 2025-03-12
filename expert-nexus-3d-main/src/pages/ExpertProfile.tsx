import { useParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

// Mock expert data (should be moved to a separate data file or fetched from an API)
const experts = [
  {
    id: "1",
    name: "Dr. Emma Thompson",
    role: "AI Research Specialist",
    area: "Artificial Intelligence",
    experience: "12+ years",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    bio: "Dr. Emma Thompson is a leading expert in Artificial Intelligence with a focus on machine learning and neural networks. She has contributed to groundbreaking research in AI applications for healthcare and autonomous systems.",
    expertise: ["Machine Learning", "Neural Networks", "AI Ethics", "Computer Vision"],
    achievements: [
      "Published 30+ research papers in top-tier journals",
      "Developed AI solutions for Fortune 500 companies",
      "Keynote speaker at major tech conferences",
      "Patent holder for innovative AI algorithms"
    ],
    education: [
      "Ph.D. in Computer Science, Stanford University",
      "M.S. in Artificial Intelligence, MIT",
      "B.S. in Computer Engineering, UC Berkeley"
    ],
    contact: {
      email: "emma.thompson@example.com",
      linkedin: "linkedin.com/in/emma-thompson"
    }
  },
  // ... other experts
];

const ExpertProfile = () => {
  const { id } = useParams();
  const expert = experts.find(e => e.id === id);

  if (!expert) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 text-center">
          <h2 className="text-2xl font-bold">Expert not found</h2>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Hero Section */}
      <div className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-background pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(#f9fafb_2px,transparent_2px),linear-gradient(90deg,#f9fafb_2px,transparent_2px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <div className="flex flex-col items-center text-center mb-16">
            <div className="relative mb-8">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-primary to-primary/50 rounded-full blur opacity-30" />
              <img
                src={expert.image}
                alt={expert.name}
                className="relative w-48 h-48 rounded-full object-cover border-4 border-background shadow-xl"
              />
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50">
              {expert.name}
            </h1>
            <p className="text-2xl text-muted-foreground mb-3">{expert.role}</p>
            <p className="text-xl text-muted-foreground mb-6">{expert.area} • {expert.experience}</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
              {expert.expertise.map((skill, index) => (
                <span
                  key={index}
                  className="px-4 py-1.5 bg-primary/10 rounded-full text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-card rounded-xl p-8 shadow-lg border border-border/50">
            {/* Left Column */}
            <div className="space-y-8">
              {/* Bio Section */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  About
                </h2>
                <p className="text-muted-foreground leading-relaxed">{expert.bio}</p>
              </div>

              {/* Education Section */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Education
                </h2>
                <ul className="space-y-3">
                  {expert.education.map((edu, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-primary/50" />
                      <span className="text-muted-foreground">{edu}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Achievements Section */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Key Achievements
                </h2>
                <ul className="space-y-3">
                  {expert.achievements.map((achievement, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-primary/50" />
                      <span className="text-muted-foreground">{achievement}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact Section */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Get in Touch
                </h2>
                <div className="flex gap-4">
                  <Button
                    className="flex-1 bg-primary/10 text-primary hover:bg-primary/20 border-none"
                    variant="outline"
                    onClick={() => window.location.href = `mailto:${expert.contact.email}`}
                  >
                    Email
                  </Button>
                  <Button
                    className="flex-1 bg-primary/10 text-primary hover:bg-primary/20 border-none"
                    variant="outline"
                    onClick={() => window.open(`https://${expert.contact.linkedin}`, '_blank')}
                  >
                    LinkedIn
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ExpertProfile;