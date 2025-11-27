import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { AppState, MeshType } from '../types';

interface ThreeSceneProps {
  appState: AppState;
}

const ThreeScene: React.FC<ThreeSceneProps> = ({ appState }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const godInputRef = useRef<HTMLDivElement>(null);
  
  // Refs to store Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const godCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const virtualPerspCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const virtualOrthoCameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const cameraHelperRef = useRef<THREE.CameraHelper | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const subjectMeshRef = useRef<THREE.Mesh | null>(null);
  const cameraModelRef = useRef<THREE.Group | null>(null); // Ref for the visual camera 3D model
  const currentMeshTypeRef = useRef<MeshType>('cube');
  const animationFrameRef = useRef<number>(0);

  // Helper to create text sprites for axes and labels
  const createAxisLabel = (text: string, color: string, size: number = 64, fontSize: number = 48) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    if (context) {
        context.font = `bold ${fontSize}px sans-serif`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = color;
        context.fillText(text, size / 2, size / 2);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2, 2, 2);
    return sprite;
  };

  // Helper to build a cute 3D Camera Model
  const createCameraModel = () => {
    const group = new THREE.Group();

    // Body
    const bodyGeo = new THREE.BoxGeometry(1, 0.8, 1.5);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Lens
    const lensGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.6, 32);
    const lensMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.8 });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.rotation.x = Math.PI / 2;
    lens.position.z = -0.9; // Stick out front
    group.add(lens);

    // Reels (Vintage look)
    const reelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
    const reelMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
    
    const reel1 = new THREE.Mesh(reelGeo, reelMat);
    reel1.position.set(0.6, 0.5, 0);
    reel1.rotation.z = Math.PI / 2;
    group.add(reel1);

    const reel2 = new THREE.Mesh(reelGeo, reelMat);
    reel2.position.set(-0.6, 0.5, 0);
    reel2.rotation.z = Math.PI / 2;
    group.add(reel2);

    // Viewfinder
    const viewGeo = new THREE.BoxGeometry(0.4, 0.4, 0.5);
    const view = new THREE.Mesh(viewGeo, bodyMat);
    view.position.y = 0.6;
    group.add(view);

    return group;
  };

  // Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current || !godInputRef.current) return;

    // 1. Setup Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0f172a'); // Slate-900
    scene.fog = new THREE.Fog('#0f172a', 20, 90); // Fade grid into background
    sceneRef.current = scene;

    // 2. Setup God Camera (The main view)
    const godCamera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    godCamera.position.set(15, 12, 15); // Adjusted for better initial view
    godCamera.lookAt(0, 0, 0);
    godCameraRef.current = godCamera;

    // 3. Setup Virtual Cameras
    const virtualPerspCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    virtualPerspCameraRef.current = virtualPerspCamera;
    
    const virtualOrthoCamera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 100);
    virtualOrthoCameraRef.current = virtualOrthoCamera;

    // 4. Setup Renderer with Better Visuals
    const renderer = new THREE.WebGLRenderer({ 
        canvas: canvasRef.current,
        antialias: true,
        alpha: false
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(containerRef.current.clientWidth || 800, containerRef.current.clientHeight || 600);
    renderer.setScissorTest(true); 
    renderer.shadowMap.enabled = true; // Enable Shadows
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
    renderer.outputColorSpace = THREE.SRGBColorSpace; // Better colors
    rendererRef.current = renderer;

    // 5. Setup Controls - Attach to the LEFT PANEL overlay only
    const controls = new OrbitControls(godCamera, godInputRef.current);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent going under the floor
    controlsRef.current = controls;

    // 6. Lighting & Environment
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    scene.add(dirLight);

    // Fill light for aesthetics
    const pointLight = new THREE.PointLight(0x3b82f6, 0.8);
    pointLight.position.set(-10, 10, -10);
    scene.add(pointLight);

    // Grid
    const gridHelper = new THREE.GridHelper(50, 50, 0x475569, 0x1e293b);
    gridHelper.position.y = -2.01;
    scene.add(gridHelper);

    // Floor to catch shadows
    const floorGeo = new THREE.PlaneGeometry(100, 100);
    const floorMat = new THREE.MeshStandardMaterial({ 
        color: 0x0f172a, 
        roughness: 0.8, 
        metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.02; // Just below grid
    floor.receiveShadow = true;
    scene.add(floor);
    
    // Axes at origin
    const axesLength = 10;
    const axesHelper = new THREE.AxesHelper(axesLength);
    // Colors: X=Red, Y=Green, Z=Blue (Default)
    scene.add(axesHelper);

    // Axis Labels
    const labelX = createAxisLabel('X', '#ff6b6b');
    labelX.position.set(axesLength + 1, 0, 0);
    scene.add(labelX);

    const labelY = createAxisLabel('Y', '#51cf66');
    labelY.position.set(0, axesLength + 1, 0);
    scene.add(labelY);

    const labelZ = createAxisLabel('Z', '#339af0');
    labelZ.position.set(0, 0, axesLength + 1);
    scene.add(labelZ);

    // 7. Subject Object (Default Cube)
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const materials = [
      new THREE.MeshStandardMaterial({ color: 0xef4444 }), // Red
      new THREE.MeshStandardMaterial({ color: 0x991b1b }), // Dark Red
      new THREE.MeshStandardMaterial({ color: 0x22c55e }), // Green
      new THREE.MeshStandardMaterial({ color: 0x166534 }), // Dark Green
      new THREE.MeshStandardMaterial({ color: 0x3b82f6 }), // Blue
      new THREE.MeshStandardMaterial({ color: 0x1e40af }), // Dark Blue
    ];
    const subjectMesh = new THREE.Mesh(geometry, materials);
    subjectMesh.castShadow = true;
    subjectMesh.receiveShadow = true;
    scene.add(subjectMesh);
    subjectMeshRef.current = subjectMesh;

    // 8. Virtual Camera Visuals
    const camModel = createCameraModel();
    camModel.scale.set(0.5, 0.5, 0.5); // Smaller camera model
    scene.add(camModel);
    cameraModelRef.current = camModel;

    const camLabel = createAxisLabel('Virtual Camera', '#fbbf24', 256, 32); // Gold color
    // Scale up label to compensate for parent downscale (0.5). 8 * 0.5 = 4 (original visual size)
    camLabel.scale.set(8, 8, 8); 
    camLabel.position.y = 3.0; // 3.0 * 0.5 = 1.5 (original visual height)
    camModel.add(camLabel);

    // Initial Camera Helper
    const helper = new THREE.CameraHelper(virtualPerspCamera);
    scene.add(helper);
    cameraHelperRef.current = helper;

    // 9. Animation Loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      if (controlsRef.current) controlsRef.current.update();
      
      if (!rendererRef.current || !sceneRef.current || !godCameraRef.current) return;

      const containerW = containerRef.current?.clientWidth || 0;
      const containerH = containerRef.current?.clientHeight || 0;

      // Avoid rendering if dimensions are zero
      if (containerW === 0 || containerH === 0) return;
      
      const halfW = Math.floor(containerW / 2);
      
      // --- LEFT PANEL: God View ---
      const godAspect = halfW / containerH;
      if (godCameraRef.current.aspect !== godAspect && godAspect > 0 && isFinite(godAspect)) {
          godCameraRef.current.aspect = godAspect;
          godCameraRef.current.updateProjectionMatrix();
      }

      // Show Helper and Camera Model in God View
      if (cameraHelperRef.current) cameraHelperRef.current.visible = true;
      if (cameraModelRef.current) cameraModelRef.current.visible = true;

      rendererRef.current.setViewport(0, 0, halfW, containerH);
      rendererRef.current.setScissor(0, 0, halfW, containerH);
      rendererRef.current.setClearColor(new THREE.Color('#0f172a')); 
      rendererRef.current.render(sceneRef.current, godCameraRef.current);


      // --- RIGHT PANEL: Virtual Camera View ---
      const activeVirtualCam = appState.projection.type === 'perspective' 
        ? virtualPerspCameraRef.current 
        : virtualOrthoCameraRef.current;

      if (activeVirtualCam) {
        // Hide Helper and Camera Model in Camera View (don't block the view)
        if (cameraHelperRef.current) cameraHelperRef.current.visible = false;
        if (cameraModelRef.current) cameraModelRef.current.visible = false;

        rendererRef.current.setViewport(halfW, 0, halfW, containerH);
        rendererRef.current.setScissor(halfW, 0, halfW, containerH);
        // Slightly lighter background for the virtual view to distinguish it
        rendererRef.current.setClearColor(new THREE.Color('#111827')); 
        rendererRef.current.render(sceneRef.current, activeVirtualCam);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      if (rendererRef.current) rendererRef.current.dispose();
      controls.dispose();
    };
  }, []); // Run once on mount

  // Update Effect
  useEffect(() => {
    if (!sceneRef.current || !subjectMeshRef.current || !virtualPerspCameraRef.current || !virtualOrthoCameraRef.current) return;

    // 1. Update Geometry & Materials
    if (appState.model.meshType !== currentMeshTypeRef.current) {
        const mesh = subjectMeshRef.current;
        mesh.geometry.dispose();
        let newGeo;
        let newMat: THREE.Material | THREE.Material[];
        
        // PBR Materials for better visuals
        switch (appState.model.meshType) {
            case 'sphere':
                newGeo = new THREE.SphereGeometry(1.5, 64, 64);
                newMat = new THREE.MeshStandardMaterial({ 
                    color: 0x3b82f6, 
                    roughness: 0.1, 
                    metalness: 0.2 
                });
                break;
            case 'torusKnot':
                newGeo = new THREE.TorusKnotGeometry(1, 0.3, 128, 32);
                newMat = new THREE.MeshStandardMaterial({ 
                    color: 0x8b5cf6, // Violet
                    roughness: 0.3, 
                    metalness: 0.5 
                });
                break;
            case 'icosahedron':
                newGeo = new THREE.IcosahedronGeometry(1.5, 0);
                newMat = new THREE.MeshStandardMaterial({ 
                    color: 0x10b981, // Emerald
                    roughness: 0.2, 
                    metalness: 0.1,
                    flatShading: true
                });
                break;
            case 'cube':
            default:
                newGeo = new THREE.BoxGeometry(2, 2, 2);
                newMat = [
                  new THREE.MeshStandardMaterial({ color: 0xef4444 }), 
                  new THREE.MeshStandardMaterial({ color: 0x991b1b }), 
                  new THREE.MeshStandardMaterial({ color: 0x22c55e }), 
                  new THREE.MeshStandardMaterial({ color: 0x166534 }), 
                  new THREE.MeshStandardMaterial({ color: 0x3b82f6 }), 
                  new THREE.MeshStandardMaterial({ color: 0x1e40af }), 
                ];
                break;
        }
        mesh.geometry = newGeo;
        mesh.material = newMat;
        currentMeshTypeRef.current = appState.model.meshType;
    }

    // 2. Update Model Transform
    const { position, rotation, scale } = appState.model;
    subjectMeshRef.current.position.set(position.x, position.y, position.z);
    subjectMeshRef.current.rotation.set(
      THREE.MathUtils.degToRad(rotation.x), 
      THREE.MathUtils.degToRad(rotation.y), 
      THREE.MathUtils.degToRad(rotation.z)
    );
    const safeScale = scale === 0 ? 0.001 : scale;
    subjectMeshRef.current.scale.set(safeScale, safeScale, safeScale);

    // 3. Select Active Camera & Update Projection
    const isPersp = appState.projection.type === 'perspective';
    let activeCam: THREE.Camera = isPersp ? virtualPerspCameraRef.current : virtualOrthoCameraRef.current;

    const container = containerRef.current;
    let splitAspect = 1.0; 
    
    if (container && container.clientHeight > 0) {
        splitAspect = (container.clientWidth / 2) / container.clientHeight;
    }
    if (!Number.isFinite(splitAspect) || splitAspect <= 0) {
        splitAspect = 1.0; 
    }

    if (isPersp) {
      const cam = virtualPerspCameraRef.current;
      cam.fov = appState.projection.fov;
      cam.near = Math.max(0.1, appState.projection.near);
      cam.far = Math.max(cam.near + 0.1, appState.projection.far);
      cam.aspect = splitAspect; 
      cam.updateProjectionMatrix();
    } else {
      const cam = virtualOrthoCameraRef.current;
      const size = appState.projection.orthoSize;
      cam.left = -size * splitAspect;
      cam.right = size * splitAspect;
      cam.top = size;
      cam.bottom = -size;
      cam.near = Math.max(0.1, appState.projection.near);
      cam.far = Math.max(cam.near + 0.1, appState.projection.far);
      cam.updateProjectionMatrix();
    }
    
    // 4. Update View Matrix & Camera Model
    const { position: eye, target, up } = appState.view;
    activeCam.position.set(eye.x, eye.y, eye.z);
    
    // Gimbal Lock Protection
    const eyeVec = new THREE.Vector3(eye.x, eye.y, eye.z);
    const targetVec = new THREE.Vector3(target.x, target.y, target.z);
    const upVec = new THREE.Vector3(up.x, up.y, up.z).normalize();
    const lookDir = new THREE.Vector3().subVectors(targetVec, eyeVec).normalize();
    
    if (Math.abs(lookDir.dot(upVec)) > 0.99) {
       activeCam.up.set(up.x, up.y, up.z + 0.01);
    } else {
       activeCam.up.set(up.x, up.y, up.z);
    }
    
    if (eyeVec.distanceTo(targetVec) < 0.001) {
        activeCam.lookAt(target.x, target.y, target.z - 1.0);
    } else {
        activeCam.lookAt(target.x, target.y, target.z);
    }
    
    activeCam.updateMatrixWorld();

    // UPDATE CAMERA MODEL VISUAL
    if (cameraModelRef.current) {
        cameraModelRef.current.position.copy(activeCam.position);
        cameraModelRef.current.quaternion.copy(activeCam.quaternion);
    }

    // 5. Update Helper efficiently
    let helper = cameraHelperRef.current;
    if (helper && helper.camera !== activeCam) {
        sceneRef.current.remove(helper);
        helper.dispose();
        helper = null;
    }
    
    if (!helper) {
        helper = new THREE.CameraHelper(activeCam);
        sceneRef.current.add(helper);
        cameraHelperRef.current = helper;
    }
    
    helper.update();

  }, [appState]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
        if (!containerRef.current || !rendererRef.current) return;
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        if (width === 0 || height === 0) return;
        rendererRef.current.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative group">
       <canvas ref={canvasRef} className="block w-full h-full" />
       
       {/* Input Zone for God Mode */}
       <div 
         ref={godInputRef} 
         className="absolute left-0 top-0 w-1/2 h-full z-10 cursor-move" 
         title="Drag to rotate World View"
       />

       {/* Labels */}
       <div className="absolute left-4 top-4 pointer-events-none z-20">
          <span className="text-white/90 text-sm font-bold bg-slate-900/80 px-3 py-1.5 rounded border-l-4 border-blue-500 shadow-lg backdrop-blur-sm">
            World View (God Mode)
          </span>
       </div>
       <div className="absolute left-[50%] ml-4 top-4 pointer-events-none z-20">
          <span className="text-white/90 text-sm font-bold bg-black/80 px-3 py-1.5 rounded border-l-4 border-yellow-500 shadow-lg backdrop-blur-sm">
            Camera View
          </span>
       </div>
       
       <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-700/50 z-20 pointer-events-none"></div>
    </div>
  );
};

export default ThreeScene;