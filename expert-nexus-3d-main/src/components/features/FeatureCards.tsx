
import { useEffect, useRef } from "react";
import * as THREE from "three";
import GlassCard from "@/components/ui/GlassCard";
import { ArrowRight, Brain, Globe, LineChart, Users } from "lucide-react";
import { createScene, createFloatingObjects } from "@/utils/three/setupScene";

const features = [
  {
    title: "Diverse Expert Network",
    description: "Access thousands of verified specialists across 120+ industries and specialties.",
    icon: <Users className="w-10 h-10 text-blue-500" />,
    color: "badge-blue",
    badgeText: "Network",
  },
  {
    title: "Personalized Engagements",
    description: "Get matched with experts tailored to your specific needs and challenges.",
    icon: <Globe className="w-10 h-10 text-purple-500" />,
    color: "badge-purple",
    badgeText: "Personalization",
  },
  {
    title: "AI-Powered Research",
    description: "Leverage our AI to analyze trends, identify insights, and enhance decision-making.",
    icon: <Brain className="w-10 h-10 text-green-500" />,
    color: "badge-green",
    badgeText: "Intelligence",
  },
  {
    title: "Data-Driven Insights",
    description: "Visualize market trends and expert recommendations with interactive dashboards.",
    icon: <LineChart className="w-10 h-10 text-blue-500" />,
    color: "badge-blue",
    badgeText: "Analytics",
  },
];

const FeatureCards = () => {
  const consultantVisualizationRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    if (!consultantVisualizationRef.current) return;

    const container = consultantVisualizationRef.current;
    
    // Create scene
    const { scene, camera, animate, stop } = createScene({
      container,
      background: "transparent",
      cameraPosition: new THREE.Vector3(0, 0, 5),
    });
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(2, 5, 3);
    scene.add(directionalLight);
    
    // Add floating objects
    const { objects, animate: animateObjects } = createFloatingObjects(5);
    objects.forEach(object => scene.add(object));
    
    // Add central user object
    const userGeometry = new THREE.SphereGeometry(0.7, 32, 32);
    const userMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8B5CF6,
      emissive: 0x8B5CF6,
      emissiveIntensity: 0.2,
      roughness: 0.3,
      metalness: 0.8
    });
    const userSphere = new THREE.Mesh(userGeometry, userMaterial);
    scene.add(userSphere);
    
    // Add connection lines between the user and floating objects
    const linesMaterial = new THREE.LineBasicMaterial({ 
      color: 0xD3E4FD, 
      transparent: true,
      opacity: 0.6
    });
    
    const connectionLines: THREE.Line[] = [];
    
    objects.forEach(object => {
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        object.position
      ]);
      const line = new THREE.Line(lineGeometry, linesMaterial);
      scene.add(line);
      connectionLines.push(line);
    });
    
    // Start animation
    animate((delta) => {
      animateObjects(delta);
      
      // Update the connection lines
      objects.forEach((object, index) => {
        const positions = new Float32Array([
          userSphere.position.x, userSphere.position.y, userSphere.position.z,
          object.position.x, object.position.y, object.position.z
        ]);
        connectionLines[index].geometry.setAttribute(
          'position', 
          new THREE.BufferAttribute(positions, 3)
        );
      });
      
      // Rotate user sphere
      userSphere.rotation.y += delta * 0.5;
      
      // Slight camera movement
      camera.position.x = Math.sin(delta * 0.2) * 0.3;
      camera.position.y = Math.cos(delta * 0.2) * 0.3;
      camera.lookAt(0, 0, 0);
    });
    
    // Store scene reference for cleanup
    sceneRef.current = { stop };
    
    return () => {
      if (sceneRef.current) {
        sceneRef.current.stop();
      }
    };
  }, []);

  return (
    <section id="features" className="section-container relative">
      <div className="text-center mb-16">
        <span className="badge badge-green mb-4">Features</span>
        <h2 className="section-title">
          Powerful Tools to <span className="text-gradient">Enhance</span> Your Decisions
        </h2>
        <p className="section-subtitle mx-auto">
          Our platform offers comprehensive features designed to connect you 
          with the right expertise and insights for your specific challenges.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {features.map((feature, index) => (
          <GlassCard
            key={index}
            className="p-8 h-full animate-fade-in"
            style={{ animationDelay: `${index * 100 + 300}ms` }}
          >
            <div className="mb-4">
              <span className={`badge ${feature.color}`}>{feature.badgeText}</span>
            </div>
            
            <div className="mb-6">{feature.icon}</div>
            
            <h3 className="text-xl font-display font-semibold mb-3">{feature.title}</h3>
            
            <p className="text-muted-foreground mb-6">{feature.description}</p>
            
            <button className="flex items-center text-primary font-medium hover:underline group transition-all">
              Learn more
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </GlassCard>
        ))}
      </div>

      {/* Highlight feature with Three.js visualization */}
      <GlassCard className="mt-12 p-8 md:p-12 animate-fade-in [animation-delay:700ms]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <span className="badge badge-purple mb-4">Premium Feature</span>
            <h3 className="text-2xl md:text-3xl font-display font-semibold mb-4">
              Custom Expert Consultation Sessions
            </h3>
            
            <p className="text-muted-foreground mb-6">
              Schedule one-on-one virtual meetings with our top industry experts 
              for personalized advice and insights tailored to your specific challenges.
            </p>
            
            <ul className="space-y-3 mb-8">
              {[
                "Direct access to top-tier specialists",
                "Flexible scheduling options",
                "Secure and confidential sessions",
                "Follow-up documentation and recommendations",
              ].map((item, i) => (
                <li key={i} className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            
            <button className="btn-primary">
              Schedule a Session
            </button>
          </div>
          
          <div className="relative w-full aspect-square min-h-[300px]">
            {/* Three.js visualization container */}
            <div 
              ref={consultantVisualizationRef} 
              className="absolute inset-0 rounded-xl overflow-hidden"
            />
            
            {/* Overlay text labels */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="absolute top-[20%] left-[15%] bg-white/80 backdrop-blur-sm text-xs rounded-full px-2 py-1 shadow-md">
                Finance Expert
              </div>
              <div className="absolute top-[25%] right-[20%] bg-white/80 backdrop-blur-sm text-xs rounded-full px-2 py-1 shadow-md">
                Technology Advisor
              </div>
              <div className="absolute bottom-[30%] left-[25%] bg-white/80 backdrop-blur-sm text-xs rounded-full px-2 py-1 shadow-md">
                Marketing Specialist
              </div>
              <div className="absolute bottom-[20%] right-[15%] bg-white/80 backdrop-blur-sm text-xs rounded-full px-2 py-1 shadow-md">
                Industry Analyst
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg text-sm font-medium">
                  You
                </div>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </section>
  );
};

export default FeatureCards;
