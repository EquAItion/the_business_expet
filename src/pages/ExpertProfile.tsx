import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "react-error-boundary";
import { FaLinkedin, FaVideo, FaPhone, FaComments } from 'react-icons/fa';

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
  linkedinUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  twitterUrl?: string;
}

const ExpertProfileContent = () => {
  const { id } = useParams<{ id: string }>();
  const [expert, setExpert] = useState<Expert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExpert = async (id: string) => {
      try {
        setLoading(true);
        console.log("Fetching expert profile...");

        const response = await fetch(`http://localhost:5000/api/experts/profiles/${id}`);
        console.log("Response status:", response.status);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`Expert with ID ${id} not found`);
          }
          throw new Error(`Failed to fetch expert (Status: ${response.status})`);
        }

        const data = await response.json();
        console.log("Fetched expert data:", data);

        if (data.success && data.data) {
          setExpert(data.data);
        } else {
          throw new Error(data.message || "No expert found");
        }
      } catch (err) {
        console.error("Error fetching expert:", err);
        setError(err instanceof Error ? err.message : "Failed to load expert profile");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchExpert(id);
    } else {
      setError("Expert ID is missing");
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 text-center">
          <p className="text-xl">Loading expert profile...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !expert) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 text-center">
          <h2 className="text-2xl font-bold">Expert not found</h2>
          <p className="text-foreground">{error}</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="relative pt-24 pb-16 overflow-hidden">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Main Profile Card */}
            <div className="bg-card rounded-xl p-8 shadow-lg border border-border/50">
              {/* Header Section with Avatar and Basic Info */}
              {/* <div className="flex flex-col md:flex-row gap-8 items-start mb-8">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-4xl font-semibold text-primary border-2 border-primary/20 flex-shrink-0">
                  {expert?.firstName?.[0]}{expert?.lastName?.[0]}
                </div>
                <div className="flex-grow">
                  <h1 className="text-3xl font-display font-bold mb-2">
                    {expert?.firstName} {expert?.lastName}
                  </h1>
                  <p className="text-lg text-primary/80 font-medium mb-2">
                    {expert?.designation}
                  </p>
                  <p className="text-muted-foreground">
                    {expert?.currentOrganization} · {expert?.location}
                  </p>
                  <div className="flex gap-3 mt-4">
                    {expert.linkedinUrl && (
                      <Button variant="outline" size="sm" onClick={() => window.open(expert.linkedinUrl, "_blank")}>
                        <FaLinkedin className="mr-2 h-4 w-4" /> LinkedIn
                      </Button>
                    )}
                  </div>
                </div>
              </div> */}

              {/* Info Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* About & Expertise */}
                <div className="md:col-span-2 space-y-6">
                  {/* About Section */}
                <div className="prose prose-sm max-w-none text-muted-foreground">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-4xl font-semibold text-primary border-2 border-primary/20 flex-shrink-0 mb-2">
                  {expert?.first_name[0]}{expert?.last_name[0]}
                </div>
                    <h1 className="text-3xl font-display font-bold mb-2 text-primary">
                      {expert?.first_name} {expert?.last_name}
                    </h1>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">About</h3>
                    <p className="mb-2">{expert?.last_name}With {expert?.work_experience} years of experience in {expert?.expertise}, 
                      I specialize in providing expert guidance in {expert?.areas_of_help}.</p>
                      <h3 className="text-xl font-semibold mb-2 text-foreground">Organization and Location</h3>
                      <p> {expert?.current_organization} , {expert?.location}.</p>
                  </div>

                  {/* Expertise Tags */}
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Areas of Expertise</h3>
                    <div className="flex flex-wrap gap-2">
                      {expert?.expertise.split(',').map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full"
                        >
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Side Cards */}
                <div className="space-y-6">
                  {/* Pricing Card */}
                  <div className="bg-secondary/20 rounded-lg p-4">
                    <h3 className="font-semibold mb-4">Consultation Pricing</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FaVideo className="w-4 h-4 text-primary" />
                          <span className="text-sm">Video Call</span>
                        </div>
                        <span className="font-medium">${expert?.video_pricing}/hr</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FaPhone className="w-4 h-4 text-primary" />
                          <span className="text-sm">Audio Call</span>
                        </div>
                        <span className="font-medium">${expert?.audio_pricing}/hr</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FaComments className="w-4 h-4 text-primary" />
                          <span className="text-sm">Chat</span>
                        </div>
                        <span className="font-medium">${expert?.chat_pricing}/hr</span>
                      </div>
                    </div>
                  </div>

                  {/* Availability Card */}
                  <div className="bg-secondary/20 rounded-lg p-4">
                    <h3 className="font-semibold mb-4">Availability</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Next Available</span>
                        <span className="text-primary font-medium">Today, 3:00 PM</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Typical Response</span>
                        <span className="text-primary font-medium">Within 30 mins</span>
                      </div>
                      <Button className="w-full mt-4" size="sm">
                        Schedule Meeting
                      </Button>
                    </div>
                  </div>
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

const ExpertProfile = () => {
  return (
    <ErrorBoundary>
      <ExpertProfileContent />
    </ErrorBoundary>
  );
};

export default ExpertProfile;
