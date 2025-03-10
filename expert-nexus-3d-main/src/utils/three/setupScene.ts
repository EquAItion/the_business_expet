import * as THREE from "three";

interface SceneOptions {
  container: HTMLElement;
  camera?: THREE.PerspectiveCamera;
  cameraPosition?: THREE.Vector3;
  background?: THREE.Color | string;
  near?: number;
  far?: number;
  fov?: number;
}

export const createScene = ({
  container,
  camera,
  cameraPosition = new THREE.Vector3(0, 0, 10),
  background = new THREE.Color(0xffffff),
  near = 0.1,
  far = 1000,
  fov = 75,
}: SceneOptions) => {
  // Create scene
  const scene = new THREE.Scene();
  if (background) {
    scene.background = typeof background === "string" 
      ? new THREE.Color(background) 
      : background;
  }

  // Create camera if not provided
  const perspectiveCamera = camera || new THREE.PerspectiveCamera(
    fov,
    container.clientWidth / container.clientHeight,
    near,
    far
  );
  
  if (!camera) {
    perspectiveCamera.position.copy(cameraPosition);
    scene.add(perspectiveCamera);
  }

  // Create renderer
  const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true,
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // Handle window resize
  const handleResize = () => {
    perspectiveCamera.aspect = container.clientWidth / container.clientHeight;
    perspectiveCamera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  };

  window.addEventListener("resize", handleResize);

  // Animation loop
  const clock = new THREE.Clock();
  let frameId: number | null = null;
  
  const animate = (callback?: (delta: number) => void) => {
    const delta = clock.getDelta();
    
    if (callback) {
      callback(delta);
    }
    
    renderer.render(scene, perspectiveCamera);
    frameId = requestAnimationFrame(() => animate(callback));
  };

  const stop = () => {
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
    
    window.removeEventListener("resize", handleResize);
    
    // Clean up renderer
    renderer.dispose();
    
    // Remove canvas from container
    if (renderer.domElement.parentElement) {
      renderer.domElement.parentElement.removeChild(renderer.domElement);
    }
  };

  return {
    scene,
    camera: perspectiveCamera,
    renderer,
    animate,
    stop,
  };
};

// Create a particle system for network visualization
export const createNetworkParticles = (
  count: number = 100,
  radius: number = 5,
  color: string = "#8B5CF6",
  connectionColor: string = "#D3E4FD"
) => {
  // Create particle geometry
  const particlesGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const colorObj = new THREE.Color(color);

  for (let i = 0; i < count; i++) {
    // Position particles in a sphere
    const i3 = i * 3;
    const phi = Math.random() * Math.PI * 2;
    const theta = Math.random() * Math.PI;
    const r = radius * Math.cbrt(Math.random());

    positions[i3] = r * Math.sin(theta) * Math.cos(phi);     // x
    positions[i3 + 1] = r * Math.sin(theta) * Math.sin(phi); // y
    positions[i3 + 2] = r * Math.cos(theta);                 // z

    // Set particle colors
    colors[i3] = colorObj.r;
    colors[i3 + 1] = colorObj.g;
    colors[i3 + 2] = colorObj.b;

    // Random sizes for particles but slightly larger
    sizes[i] = Math.random() * 0.7 + 0.2;
  }

  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  // Create circular particle texture
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const size = 128;
  canvas.width = size;
  canvas.height = size;
  
  if (ctx) {
    // Draw a circular particle
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    
    // Create a soft gradient for better visual
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

  // Create particle material with the circular texture
  const particlesMaterial = new THREE.PointsMaterial({
    size: 0.3,
    sizeAttenuation: true,
    transparent: true,
    depthWrite: false,
    vertexColors: true,
    map: particleTexture,
    alphaMap: particleTexture,
    alphaTest: 0.001,
  });

  // Create particle system
  const particles = new THREE.Points(particlesGeometry, particlesMaterial);

  // Create connections between particles
  const connections: THREE.Line[] = [];
  const connectedPairs = new Set<string>();
  const connectionMaterial = new THREE.LineBasicMaterial({ 
    color: connectionColor,
    transparent: true,
    opacity: 0.6,
  });

  // Connect some particles with lines
  const connectionsCount = Math.min(count * 2, 200);
  
  for (let i = 0; i < connectionsCount; i++) {
    const pointA = Math.floor(Math.random() * count);
    let pointB = Math.floor(Math.random() * count);
    
    // Avoid connecting a particle to itself
    while (pointA === pointB) {
      pointB = Math.floor(Math.random() * count);
    }
    
    // Create an ID for this pair to avoid duplicates
    const pairId = [Math.min(pointA, pointB), Math.max(pointA, pointB)].join('-');
    
    if (!connectedPairs.has(pairId)) {
      connectedPairs.add(pairId);
      
      // Create line geometry for connection
      const geometry = new THREE.BufferGeometry();
      const linePositions = new Float32Array(6);
      
      // Point A coordinates
      linePositions[0] = positions[pointA * 3];
      linePositions[1] = positions[pointA * 3 + 1];
      linePositions[2] = positions[pointA * 3 + 2];
      
      // Point B coordinates
      linePositions[3] = positions[pointB * 3];
      linePositions[4] = positions[pointB * 3 + 1];
      linePositions[5] = positions[pointB * 3 + 2];
      
      geometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
      const line = new THREE.Line(geometry, connectionMaterial);
      connections.push(line);
    }
  }

  const animate = (delta: number) => {
    particles.rotation.y += delta * 0.05;
    connections.forEach(line => {
      line.rotation.y += delta * 0.05;
    });
  };

  return {
    particles,
    connections,
    animate,
  };
};

// Create floating 3D objects
export const createFloatingObjects = (count: number = 5) => {
  const objects: THREE.Mesh[] = [];
  const materials = [
    new THREE.MeshStandardMaterial({ color: 0x3377ff, roughness: 0.5, metalness: 0.2 }),
    new THREE.MeshStandardMaterial({ color: 0x5533ff, roughness: 0.5, metalness: 0.2 }),
    new THREE.MeshStandardMaterial({ color: 0x33aaff, roughness: 0.5, metalness: 0.2 }),
  ];
  
  const geometries = [
    new THREE.TorusKnotGeometry(0.4, 0.1, 100, 16),
    new THREE.IcosahedronGeometry(0.5, 0),
    new THREE.OctahedronGeometry(0.5, 0),
  ];

  for (let i = 0; i < count; i++) {
    const geometry = geometries[Math.floor(Math.random() * geometries.length)];
    const material = materials[Math.floor(Math.random() * materials.length)];
    const object = new THREE.Mesh(geometry, material);
    
    // Position randomly
    object.position.set(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10
    );
    
    // Random scale
    const scale = Math.random() * 0.3 + 0.1;
    object.scale.set(scale, scale, scale);
    
    // Set random rotation speed
    object.userData.rotationSpeed = {
      x: Math.random() * 0.01 - 0.005,
      y: Math.random() * 0.01 - 0.005,
      z: Math.random() * 0.01 - 0.005
    };
    
    // Set random float speed
    object.userData.floatSpeed = Math.random() * 0.2 + 0.1;
    object.userData.floatDistance = Math.random() * 2 + 1;
    object.userData.initialY = object.position.y;
    object.userData.time = Math.random() * Math.PI * 2;
    
    objects.push(object);
  }

  const animate = (delta: number) => {
    objects.forEach((object) => {
      // Rotation animation
      object.rotation.x += object.userData.rotationSpeed.x;
      object.rotation.y += object.userData.rotationSpeed.y;
      object.rotation.z += object.userData.rotationSpeed.z;
      
      // Floating animation
      object.userData.time += delta * object.userData.floatSpeed;
      object.position.y = object.userData.initialY + 
        Math.sin(object.userData.time) * object.userData.floatDistance;
    });
  };

  return {
    objects,
    animate,
  };
};
