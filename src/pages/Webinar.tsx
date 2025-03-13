import React from 'react';
import Layout from "@/components/layout";

interface SpeakerProfile {
  name: string;
  title: string;
  experience: string;
  image: string;
  bio: string;
}

const speakers: SpeakerProfile[] = [
  {
    name: "Dr. Sarah Johnson",
    title: "AI Research Director",
    experience: "20+ years in AI and Machine Learning",
    image: "/placeholder.svg",
    bio: "Leading AI researcher with multiple patents and publications in deep learning."
  },
  {
    name: "Michael Chen",
    title: "Chief Technology Officer",
    experience: "18 years in Software Architecture",
    image: "/placeholder.svg",
    bio: "Pioneer in cloud computing and distributed systems architecture."
  },
  {
    name: "Dr. Emily Rodriguez",
    title: "Data Science Director",
    experience: "15 years in Big Data Analytics",
    image: "/placeholder.svg",
    bio: "Expert in data visualization and predictive modeling."
  },
  {
    name: "James Wilson",
    title: "Security Architect",
    experience: "17 years in Cybersecurity",
    image: "/placeholder.svg",
    bio: "Specialist in enterprise security and blockchain technology."
  },
  {
    name: "Dr. Lisa Zhang",
    title: "Innovation Lead",
    experience: "16 years in Product Development",
    image: "/placeholder.svg",
    bio: "Renowned for breakthrough innovations in IoT and smart devices."
  }
];

const Webinar: React.FC = () => {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-16">
        {/* Intro Section */}
        <section className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Expert Insights: Industry Leaders Share Their Vision
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join our exclusive webinar featuring renowned industry experts with over 15 years of experience.
            Gain invaluable insights, learn about cutting-edge developments, and connect with leading professionals
            who have shaped the industry.
          </p>
        </section>

        {/* Speakers Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Meet Our Distinguished Speakers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {speakers.map((speaker) => (
              <div key={speaker.name} className="bg-white rounded-lg shadow-lg p-6">
                <div className="aspect-w-1 aspect-h-1 mb-4">
                  <img
                    src={speaker.image}
                    alt={speaker.name}
                    className="rounded-full w-32 h-32 mx-auto object-cover"
                  />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 text-center">
                  {speaker.name}
                </h3>
                <p className="text-gray-600 text-center mb-2">{speaker.title}</p>
                <p className="text-gray-500 text-sm text-center mb-3">
                  {speaker.experience}
                </p>
                <p className="text-gray-700 text-center">{speaker.bio}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Video Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Webinar Preview
          </h2>
          <div className="aspect-w-16 aspect-h-9 max-w-4xl mx-auto">
            <iframe
              src="https://www.youtube.com/embed/your-video-id"
              title="Webinar Preview"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-lg shadow-lg"
            ></iframe>
          </div>
        </section>

        {/* Registration Button */}
        <section className="text-center">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg transform transition hover:scale-105"
            onClick={() => {
              // Add registration logic here
              console.log('Register clicked');
            }}
          >
            Register Now
          </button>
        </section>
      </div>
    </Layout>
  );
};

export default Webinar;