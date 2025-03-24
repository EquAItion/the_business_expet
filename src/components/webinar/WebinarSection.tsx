import { useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import Footer from "../layout/Footer";
import Navbar from "../layout/Navbar";

const areasOfInterest = [
  "AI Analytics",
  "Machine Learning",
  "Neural Networks",
  "Data Science",
  "AI Development",
  "Optimization"
];

const WebinarSection = () => {
  const [formData, setFormData] = useState({
    name: "",
    profession: "",
    email: "",
    phone: "",
    areaOfInterest: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log("Form submitted:", formData);
  };

  return (
    <>
    <Navbar />
    <section id="webinar" className="section-container relative pt-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
        <span className="badge badge-blue mb-4">Upcoming Webinar</span>
        <h2 className="section-title">
          Experts <span className="text-gradient">Masterclass</span>
        </h2>
        <p className="section-subtitle mx-auto">
        Join our experts-led webinar at Expertise Station to explore business challenges and effective solutions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
        {/* Webinar Information */}
        <GlassCard className="p-8">
          <h3 className="text-2xl font-display font-semibold mb-6">Event Details</h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold mb-2">About the Webinar</h4>
              <p className="text-muted-foreground">
              "Join our Expertise Station webinar to explore how AI is transforming industries. Learn practical implementation strategies from industry experts in this interactive session, covering cutting-edge AI technologies and their real-world applications."
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-2">Key Topics</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Latest AI trends and innovations</li>
                <li>Practical implementation strategies</li>
                <li>Real-world case studies</li>
                <li>Q&A session with experts</li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-lg font-semibold mb-2">Date & Time</h4>
                <p className="text-muted-foreground">December 15, 2023<br />2:00 PM - 4:00 PM EST</p>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-2">Platform</h4>
                <p className="text-muted-foreground">Zoom Virtual Meeting<br />Link will be shared upon registration</p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Registration Form */}
        <GlassCard className="p-8">
          <h3 className="text-2xl font-display font-semibold mb-6">Register Now</h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full px-4 py-2 rounded-lg bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="profession" className="block text-sm font-medium mb-2">
                Profession
              </label>
              <input
                type="text"
                id="profession"
                name="profession"
                required
                className="w-full px-4 py-2 rounded-lg bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.profession}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full px-4 py-2 rounded-lg bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-2">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                className="w-full px-4 py-2 rounded-lg bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="areaOfInterest" className="block text-sm font-medium mb-2">
                Area of Interest
              </label>
              <select
                id="areaOfInterest"
                name="areaOfInterest"
                required
                className="w-full px-4 py-2 rounded-lg bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.areaOfInterest}
                onChange={handleInputChange}
              >
                <option value="">Select an area</option>
                {areasOfInterest.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3 text-center"
            >
              Register for Webinar
            </button>
          </form>
        </GlassCard>
      </div>

      {/* YouTube Video Section */}
      <div className="mt-16 flex justify-center">
        <div className="w-full max-w-4xl aspect-video">
          <iframe
            className="w-full h-full rounded-xl"
            src="https://www.youtube.com/embed/your-video-id"
            title="Webinar Preview"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </div>
  </section>
<Footer />
</>
  );
};

export default WebinarSection;