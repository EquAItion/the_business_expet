import * as THREE from "three";

export interface GlobeOptions {
  radius?: number;
  segments?: number;
  particleCount?: number;
  particleSize?: number;
  color?: string;
  glowColor?: string;
  rotationSpeed?: number;
}

export const createGlobe = ({
  radius = 3,
  segments = 64,
  particleCount = 10000,
  particleSize = 0.02,
  color = "#4a9eff",
  glowColor = "#4a9eff",
  rotationSpeed = 0.1,
}: GlobeOptions = {}) => {
  // Create particles geometry
  const particlesGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const colorObj = new THREE.Color(color);

  for (let i = 0; i < particleCount; i++) {
    // Generate points on a sphere using spherical coordinates
    const phi = Math.random() * Math.PI * 2; // Azimuthal angle (around y-axis)
    const theta = Math.acos((Math.random() * 2) - 1); // Polar angle (from y-axis)
    
    const x = radius * Math.sin(theta) * Math.cos(phi);
    const y = radius * Math.sin(theta) * Math.sin(phi);
    const z = radius * Math.cos(theta);

    const i3 = i * 3;
    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;

    // Add slight color variation
    const colorVariation = Math.random() * 0.2 - 0.1;
    colors[i3] = Math.max(0, Math.min(1, colorObj.r + colorVariation));
    colors[i3 + 1] = Math.max(0, Math.min(1, colorObj.g + colorVariation));
    colors[i3 + 2] = Math.max(0, Math.min(1, colorObj.b + colorVariation));

    // Randomize particle sizes slightly
    sizes[i] = particleSize * (Math.random() * 0.5 + 0.75);
  }

  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  // Create particle texture
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const size = 128;
  canvas.width = size;
  canvas.height = size;

  if (ctx) {
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();

    // Add soft gradient
    const gradient = ctx.createRadialGradient(
      size/2, size/2, 0,
      size/2, size/2, size/2
    );
    gradient.addColorStop(0, 'white');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }

  const particleTexture = new THREE.CanvasTexture(canvas);

  // Create particles material
  const particlesMaterial = new THREE.PointsMaterial({
    size: particleSize,
    sizeAttenuation: true,
    transparent: true,
    depthWrite: false,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    map: particleTexture,
    alphaMap: particleTexture,
  });

  // Create particle system
  const particles = new THREE.Points(particlesGeometry, particlesMaterial);

  // Add glow effect
  const glowGeometry = new THREE.SphereGeometry(radius * 1.2, segments, segments);
  const glowMaterial = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
        gl_FragColor = vec4(0.4, 0.7, 1.0, 0.5) * intensity;
      }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
  });

  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  particles.add(glow);

  // Animation function
  const animate = (delta: number) => {
    particles.rotation.y += delta * rotationSpeed;
  };

  return {
    globe: particles,
    animate,
  };
};