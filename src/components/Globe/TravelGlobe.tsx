import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Destination } from '../../types/travel';
import { POPULAR_DESTINATIONS } from '../../data/popularDestinations';
import { sound } from '../../utils/audio';
import { Globe, Plane, Navigation, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface TravelGlobeProps {
  selectedDestination: Destination | null;
  onSelectDestination: (destination: Destination) => void;
  flightRoute?: {
    origin: { name: string; lat: number; lng: number };
    destination: { name: string; lat: number; lng: number };
  } | null;
  onQuickPlan?: (dest: Destination) => void;
}

// Convert Lat/Lng to Vector3 on a sphere of radius R
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Generate procedural earth map on an HTML5 canvas (100% procedural, 0 external images)
function createProceduralEarthTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Deep ocean gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  oceanGrad.addColorStop(0, '#0a192f');
  oceanGrad.addColorStop(0.5, '#020b18');
  oceanGrad.addColorStop(1, '#071526');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle longitude & latitude grid lines
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 128) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Draw procedural stylized landmasses
  const landGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  landGrad.addColorStop(0, '#102a43');
  landGrad.addColorStop(0.5, '#1e3a5f');
  landGrad.addColorStop(1, '#0f2942');
  ctx.fillStyle = landGrad;

  // Approximate continents with organic shapes
  const continents = [
    // North America
    [[350, 150], [550, 140], [600, 240], [500, 360], [420, 320], [320, 220]],
    // South America
    [[520, 420], [620, 450], [580, 680], [530, 780], [480, 600]],
    // Europe
    [[950, 180], [1120, 170], [1180, 260], [1050, 320], [940, 260]],
    // Africa
    [[950, 360], [1150, 380], [1180, 620], [1050, 760], [920, 520]],
    // Asia
    [[1180, 160], [1650, 180], [1720, 360], [1500, 500], [1250, 400]],
    // Australia
    [[1550, 600], [1720, 620], [1680, 780], [1520, 740]],
    // Greenland & UK
    [[680, 100], [800, 110], [750, 170]],
    [[920, 220], [960, 210], [940, 250]]
  ];

  continents.forEach(poly => {
    ctx.beginPath();
    ctx.moveTo(poly[0][0], poly[0][1]);
    for (let i = 1; i < poly.length; i++) {
      ctx.lineTo(poly[i][0], poly[i][1]);
    }
    ctx.closePath();
    ctx.fill();

    // Continent border glow
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  });

  // Add micro coastal island clusters
  ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';
  for (let i = 0; i < 400; i++) {
    const rx = Math.random() * canvas.width;
    const ry = Math.random() * canvas.height;
    ctx.fillRect(rx, ry, 2, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export const TravelGlobe: React.FC<TravelGlobeProps> = ({
  selectedDestination,
  onSelectDestination,
  flightRoute,
  onQuickPlan,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredDest, setHoveredDest] = useState<Destination | null>(null);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const globeRadius = 4.2;

  // Three.js internal refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const earthMeshRef = useRef<THREE.Mesh | null>(null);
  const pinsGroupRef = useRef<THREE.Group | null>(null);
  const flightGroupRef = useRef<THREE.Group | null>(null);
  const targetCameraPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 2, 10));
  const isDraggingRef = useRef<boolean>(false);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pinMeshesRef = useRef<Map<string, THREE.Object3D>>(new Map());

  // Handle zooming
  const handleZoom = (delta: number) => {
    if (!cameraRef.current) return;
    const cam = cameraRef.current;
    const currentDist = cam.position.length();
    const newDist = Math.max(6, Math.min(16, currentDist + delta));
    cam.position.setLength(newDist);
    targetCameraPosRef.current.setLength(newDist);
  };

  const handleResetCamera = useCallback(() => {
    targetCameraPosRef.current.set(0, 2.5, 11);
    setIsRotating(true);
  }, []);

  // Update camera focus when selected destination changes
  useEffect(() => {
    if (selectedDestination && cameraRef.current) {
      const pinVec = latLngToVector3(selectedDestination.lat, selectedDestination.lng, globeRadius);
      const camTarget = pinVec.clone().normalize().multiplyScalar(9.5);
      camTarget.y += 0.8;
      targetCameraPosRef.current.copy(camTarget);
      setIsRotating(false);
    }
  }, [selectedDestination, globeRadius]);

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL guard
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 2, 11);
    cameraRef.current = camera;

    // WebGLRenderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // Studio Environment map
    try {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch {
      // safe fallback
    }

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 2.2);
    dirLight1.position.set(12, 10, 10);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x818cf8, 1.4);
    dirLight2.position.set(-12, -6, -8);
    scene.add(dirLight2);

    // 1. Earth Sphere
    const earthGeometry = new THREE.SphereGeometry(globeRadius, 64, 64);
    const earthTexture = createProceduralEarthTexture();
    const earthMaterial = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.65,
      metalness: 0.15,
      bumpScale: 0.05,
    });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earthMesh);
    earthMeshRef.current = earthMesh;

    // 2. Atmosphere Glow Mesh
    const atmosGeometry = new THREE.SphereGeometry(globeRadius * 1.04, 48, 48);
    const atmosMaterial = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.15,
      roughness: 0.9,
      metalness: 0.1,
      side: THREE.BackSide,
    });
    const atmosMesh = new THREE.Mesh(atmosGeometry, atmosMaterial);
    scene.add(atmosMesh);

    // 3. Grounding Contact Shadow Ring
    const shadowGeo = new THREE.RingGeometry(globeRadius * 0.8, globeRadius * 1.3, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x020617,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = Math.PI / 2;
    shadowMesh.position.y = -globeRadius * 1.15;
    scene.add(shadowMesh);

    // 4. Destination Pins Group
    const pinsGroup = new THREE.Group();
    scene.add(pinsGroup);
    pinsGroupRef.current = pinsGroup;

    // 5. Flight Arcs Group
    const flightGroup = new THREE.Group();
    scene.add(flightGroup);
    flightGroupRef.current = flightGroup;

    // Raycasting for interactive click & hover
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Populate Destination Pins
    POPULAR_DESTINATIONS.forEach(dest => {
      const pinGroup = new THREE.Group();
      const pos = latLngToVector3(dest.lat, dest.lng, globeRadius);
      pinGroup.position.copy(pos);
      pinGroup.lookAt(new THREE.Vector3(0, 0, 0));

      // Pin Head (glowing emerald/cyan orb)
      const headGeo = new THREE.SphereGeometry(0.12, 16, 16);
      const headMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.8,
        roughness: 0.2,
        metalness: 0.8,
      });
      const headMesh = new THREE.Mesh(headGeo, headMat);
      headMesh.position.z = -0.3;
      pinGroup.add(headMesh);

      // Pin Stem (cylinder)
      const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
      const stemMat = new THREE.MeshStandardMaterial({
        color: 0x34d399,
        metalness: 0.9,
        roughness: 0.1,
      });
      const stemMesh = new THREE.Mesh(stemGeo, stemMat);
      stemMesh.rotation.x = Math.PI / 2;
      stemMesh.position.z = -0.15;
      pinGroup.add(stemMesh);

      // Pin Base Ring
      const ringGeo = new THREE.RingGeometry(0.06, 0.12, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      pinGroup.add(ringMesh);

      // Save destination reference
      pinGroup.userData = { destination: dest };
      pinsGroup.add(pinGroup);
      pinMeshesRef.current.set(dest.id, pinGroup);
    });

    // Pointer Events for Drag & Rotation
    const handlePointerDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDraggingRef.current && earthMeshRef.current) {
        setIsRotating(false);
        const deltaX = e.clientX - mousePosRef.current.x;
        const deltaY = e.clientY - mousePosRef.current.y;
        mousePosRef.current = { x: e.clientX, y: e.clientY };

        earthMeshRef.current.rotation.y += deltaX * 0.005;
        pinsGroup.rotation.y += deltaX * 0.005;
        flightGroup.rotation.y += deltaX * 0.005;

        earthMeshRef.current.rotation.x += deltaY * 0.003;
        pinsGroup.rotation.x += deltaY * 0.003;
        flightGroup.rotation.x += deltaY * 0.003;
      } else {
        // Raycast hover check
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(pinsGroup.children, true);
        if (intersects.length > 0) {
          let rootObj: THREE.Object3D | null = intersects[0].object;
          while (rootObj && !rootObj.userData.destination && rootObj.parent) {
            rootObj = rootObj.parent;
          }
          if (rootObj && rootObj.userData.destination) {
            setHoveredDest(rootObj.userData.destination);
            container.style.cursor = 'pointer';
            return;
          }
        }
        setHoveredDest(null);
        container.style.cursor = 'grab';
      }
    };

    const handlePointerUp = (e: MouseEvent) => {
      const moved = Math.hypot(e.clientX - mousePosRef.current.x, e.clientY - mousePosRef.current.y);
      isDraggingRef.current = false;

      // Detect click on pin if not dragging
      if (moved < 5) {
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(pinsGroup.children, true);

        if (intersects.length > 0) {
          let rootObj: THREE.Object3D | null = intersects[0].object;
          while (rootObj && !rootObj.userData.destination && rootObj.parent) {
            rootObj = rootObj.parent;
          }
          if (rootObj && rootObj.userData.destination) {
            sound.playPinSelect();
            onSelectDestination(rootObj.userData.destination);
          }
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      handleZoom(e.deltaY * 0.005);
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    domElement.addEventListener('wheel', handleWheel, { passive: false });

    // Handle Window Resize
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Smooth camera interpolation
      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCameraPosRef.current.x, 3.5, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCameraPosRef.current.y, 3.5, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCameraPosRef.current.z, 3.5, delta);
      camera.lookAt(0, 0, 0);

      // Subtle natural spin when idle
      if (isRotating && !isDraggingRef.current && earthMeshRef.current) {
        const spin = 0.12 * delta;
        earthMeshRef.current.rotation.y += spin;
        pinsGroup.rotation.y += spin;
        flightGroup.rotation.y += spin;
      }

      // Animate pin heads gentle pulse
      const t = clock.getElapsedTime();
      pinsGroup.children.forEach((p, idx) => {
        const head = p.children[0] as THREE.Mesh;
        if (head && head.material) {
          const mat = head.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = 0.5 + Math.sin(t * 3 + idx) * 0.4;
        }
      });

      // Animate flight arc dash offset if present
      if (flightGroup.children.length > 0) {
        flightGroup.children.forEach(arc => {
          if (arc instanceof THREE.Line) {
            const mat = arc.material as THREE.LineDashedMaterial;
            if (mat && 'dashOffset' in mat) {
              (mat as unknown as { dashOffset: number }).dashOffset -= delta * 3;
            }
          }
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animId);
      domElement.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      domElement.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);

      earthGeometry.dispose();
      earthMaterial.dispose();
      earthTexture.dispose();
      atmosGeometry.dispose();
      atmosMaterial.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []); // Run once on mount

  // Render 3D Flight Arc Route whenever route updates
  useEffect(() => {
    const flightGroup = flightGroupRef.current;
    if (!flightGroup) return;

    // Clear previous flight arcs
    while (flightGroup.children.length > 0) {
      const obj = flightGroup.children[0];
      if (obj instanceof THREE.Line) {
        obj.geometry.dispose();
        (obj.material as THREE.Material).dispose();
      }
      flightGroup.remove(obj);
    }

    if (!flightRoute) return;

    const vOrigin = latLngToVector3(flightRoute.origin.lat, flightRoute.origin.lng, globeRadius);
    const vDest = latLngToVector3(flightRoute.destination.lat, flightRoute.destination.lng, globeRadius);

    // Calculate midpoint elevated above globe surface for realistic sub-orbital arc
    const vMid = vOrigin.clone().add(vDest).multiplyScalar(0.5);
    const distance = vOrigin.distanceTo(vDest);
    const elevation = Math.min(2.5, Math.max(0.8, distance * 0.28));
    vMid.normalize().multiplyScalar(globeRadius + elevation);

    // Quadratic Bezier Curve
    const curve = new THREE.QuadraticBezierCurve3(vOrigin, vMid, vDest);
    const points = curve.getPoints(64);
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);

    // Flight Arc Glowing Dashed Material
    const lineMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 0.35,
      gapSize: 0.15,
      linewidth: 2,
    });

    const flightLine = new THREE.Line(lineGeo, lineMat);
    flightLine.computeLineDistances();
    flightGroup.add(flightLine);

    // Add plane marker at apex
    const planeGeo = new THREE.ConeGeometry(0.12, 0.3, 8);
    const planeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      metalness: 0.9,
      roughness: 0.1,
    });
    const planeMesh = new THREE.Mesh(planeGeo, planeMat);
    planeMesh.position.copy(vMid);
    planeMesh.lookAt(vDest);
    planeMesh.rotateX(Math.PI / 2);
    flightGroup.add(planeMesh);
  }, [flightRoute, globeRadius]);

  return (
    <div className="relative w-full h-full min-h-[500px] select-none overflow-hidden rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800/80 shadow-2xl">
      {/* Three.js Isolated Canvas Mount */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left: 3D Globe HUD Status */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3 bg-slate-900/80 border border-slate-700/60 rounded-xl px-3.5 py-2 text-xs text-slate-300">
        <Globe className="w-4 h-4 text-cyan-400" />
        <span className="font-semibold text-white tracking-wide">3D Global Intel Sphere</span>
        <span className="text-slate-500">|</span>
        <span className="text-slate-400">Click pins to inspect or plan</span>
      </div>

      {/* Flight Route Banner Overlay if active */}
      {flightRoute && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2.5 bg-cyan-950/80 border border-cyan-500/40 rounded-full px-4 py-1.5 text-xs text-cyan-200">
          <Plane className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-medium">{flightRoute.origin.name.split(',')[0]}</span>
          <span className="text-cyan-400">⟶</span>
          <span className="font-bold text-white">{flightRoute.destination.name.split(',')[0]}</span>
        </div>
      )}

      {/* Top Right: Camera Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-slate-900/85 border border-slate-700/70 rounded-xl p-1 shadow-lg">
        <button
          onClick={() => handleZoom(-1.5)}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(1.5)}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => setIsRotating(prev => !prev)}
          className={`p-2 rounded-lg transition-colors ${
            isRotating ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-slate-800 text-slate-400'
          }`}
          title={isRotating ? 'Pause Rotation' : 'Auto Rotate'}
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetCamera}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
          title="Reset Camera View"
        >
          <Navigation className="w-4 h-4" />
        </button>
      </div>

      {/* Hover Pin Tooltip Card */}
      {hoveredDest && (
        <div className="absolute bottom-20 left-6 z-20 max-w-xs bg-slate-900/95 border border-cyan-500/50 rounded-xl p-3.5 shadow-2xl text-xs pointer-events-none transition-all">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-bold text-sm text-white">{hoveredDest.name}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {hoveredDest.badge}
            </span>
          </div>
          <div className="text-slate-400 mb-2">{hoveredDest.country} · {hoveredDest.tagline}</div>
          <div className="flex items-center justify-between text-slate-300 font-mono text-[11px] pt-1.5 border-t border-slate-800">
            <span>Avg Daily: ${hoveredDest.avgDailyCost}</span>
            <span className="text-cyan-400 font-sans font-semibold">Click to select</span>
          </div>
        </div>
      )}

      {/* Selected Destination Spotlight Card */}
      {selectedDestination && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-20 bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 shadow-2xl">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{selectedDestination.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-medium">
                  {selectedDestination.country}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2">{selectedDestination.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 my-2.5 text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-400 block text-[10px]">Best Season:</span>
              <span className="text-slate-200 font-medium">{selectedDestination.bestTimeToVisit}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Estimated Daily:</span>
              <span className="text-emerald-400 font-semibold font-mono">${selectedDestination.avgDailyCost} USD</span>
            </div>
          </div>

          {onQuickPlan && (
            <button
              onClick={() => {
                sound.playClick();
                onQuickPlan(selectedDestination);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-cyan-500/25 transition-all active:scale-[0.98]"
            >
              <Plane className="w-3.5 h-3.5" />
              Generate Complete AI Itinerary for {selectedDestination.name}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
