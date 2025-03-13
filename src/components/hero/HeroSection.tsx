
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createScene, createNetworkParticles } from "@/utils/three/setupScene";
import { createGlobe } from "@/utils/three/createGlobe";

const HeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    stop: () => void;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    
    // Create scene
    const { scene, camera, animate, stop } = createScene({
      container,
      background: "transparent",
      cameraPosition: new THREE.Vector3(0, 0, 10),
    });

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 5, 5);
    scene.add(directionalLight);
    // Create globe
    const { globe, animate: animateGlobe } = createGlobe({
      radius: 4,
      color: "#E2E8F0",
      emissive: "#94A3B8",
      emissiveIntensity: 0.2,
      metalness: 0.1,
      roughness: 0.3,
    });
    scene.add(globe);
    
    // Create network particles with circular dots and more visible colors
    const { particles, connections, animate: animateNetwork } = createNetworkParticles(
      200, // Count
      7,   // Radius
      "#8B5CF6", // Changed to vibrant purple
      "#D3E4FD"  // Changed to soft blue
    );
    
    scene.add(particles);
    connections.forEach(connection => scene.add(connection));
    
    // Start animation
    animate((delta) => {
      animateNetwork(delta);
      animateGlobe(delta);
      
      // Add slight camera movement
      camera.position.x = Math.sin(delta) * 0.3;
      camera.position.y = Math.cos(delta) * 0.3;
      camera.lookAt(0, 0, 0);
    });
    
    // Store scene reference for cleanup
    sceneRef.current = { stop };
    
    // Handle mouse/touch movement for interactive parallax
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      let x, y;
      
      if ('touches' in e) {
        x = e.touches[0].clientX / window.innerWidth - 0.5;
        y = e.touches[0].clientY / window.innerHeight - 0.5;
      } else {
        x = e.clientX / window.innerWidth - 0.5;
        y = e.clientY / window.innerHeight - 0.5;
      }
      
      particles.rotation.y = x * 0.5;
      particles.rotation.x = y * 0.5;
      
      connections.forEach(connection => {
        connection.rotation.y = x * 0.5;
        connection.rotation.x = y * 0.5;
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleMouseMove);
      if (sceneRef.current) {
        sceneRef.current.stop();
      }
    };
  }, []);

  return (
    <section className="relative min-h-screen pt-20 overflow-hidden bg-gradient-to-br from-purple-900/30 via-blue-900/20 to-slate-900/30 before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.05)_0%,rgba(30,58,138,0.08)_100%)]">
      {/* 3D Background */}
      <div ref={containerRef} className="absolute inset-0 z-0" />
      
      {/* Content */}
      <div className="section-container relative z-10 flex flex-col items-center justify-center min-h-[80vh]">
        <span className="badge badge-blue mb-4 animate-slide-up" style={{ animationDelay: "300ms" }}>
          Expertise · Network · Intelligence
        </span>
        
        <h1 className="section-title text-center max-w-5xl animate-slide-up" style={{ animationDelay: "400ms" }}>
          Transforming Businesses Through <span className="text-gradient">Strategic Excellence</span> 
        </h1>
        
        <p className="section-subtitle text-center animate-slide-up" style={{ animationDelay: "500ms" }}>
        Helping hundreds of businesses achieve their full potential through innovative consulting solutions.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-8 animate-slide-up" style={{ animationDelay: "600ms" }}>
          <a href="#network" className="btn-primary">
            Explore the Network
          </a>
          <a href="#features" className="btn-outline">
            Discover Features
          </a>
        </div>
        
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mt-10 animate-slide-up" style={{ animationDelay: "700ms" }}>
          <div className="text-center">
            <p className="text-4xl font-bold text-gradient">300+</p>
            <p className="text-sm text-muted-foreground">Verified Experts</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-gradient">20+</p>
            <p className="text-sm text-muted-foreground">Industries</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-gradient">95%</p>
            <p className="text-sm text-muted-foreground">Client Satisfaction</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-gradient">25+</p>
            <p className="text-sm text-muted-foreground">Years Experienced
            Experts</p>
          </div>
        </div>
      </div>
      
      {/* Gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
};

export default HeroSection;
