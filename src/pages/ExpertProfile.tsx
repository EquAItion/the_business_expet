import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "react-error-boundary";

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-card rounded-xl p-8 shadow-lg border border-border/50">
            <div>
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-4xl font-semibold text-primary mb-6 border-2 border-primary/20">
                {expert?.firstName?.[0]}{expert?.lastName?.[0]}
              </div>
              <h1 className="text-3xl font-display font-bold mb-2">
                {expert?.firstName} {expert?.lastName}
              </h1>
              <p className="text-lg text-primary/80 font-medium mb-4">
                {expert?.designation}
              </p>
              <p className="text-muted-foreground mb-6">
                {expert?.areasOfHelp}
              </p>
            </div>
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Organization</p>
                  <p className="font-medium">{expert?.currentOrganization}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Location</p>
                  <p className="font-medium">{expert?.location}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Experience</p>
                  <p className="font-medium">{expert?.workExperience} years</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Expertise</p>
                  <p className="font-medium">{expert?.expertise}</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Contact</h3>
                <div className="flex gap-4">
                  {expert.linkedinUrl && (
                    <Button variant="outline" onClick={() => window.open(expert.linkedinUrl, "_blank")}>LinkedIn</Button>
                  )}
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
