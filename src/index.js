import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Room from "./components/Room";
import Dashboard from "./Dashboard";

// Check WebGL support
function webglAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch (e) {
    return false;
  }
}

// Create container for the scene
const container = document.getElementById("scene-container") || document.body;

// Display error message if WebGL isn't available
if (!webglAvailable()) {
  const warning = document.createElement("div");
  warning.className =
    "p-6 bg-red-600 text-white rounded shadow-lg absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center max-w-lg";
  warning.innerHTML = `
    <h2 class="text-xl font-bold mb-4">WebGL Not Available</h2>
    <p class="mb-3">Your browser or device doesn't support WebGL, which is required for the 3D restaurant simulator.</p>
    <p class="mb-2">Please try:</p>
    <ul class="text-left list-disc pl-6 mb-3">
      <li>Using a modern browser like Chrome, Firefox, Edge, or Safari</li>
      <li>Enabling hardware acceleration in your browser settings</li>
      <li>Updating your graphics drivers</li>
      <li>Disabling extensions that might interfere with WebGL</li>
    </ul>
  `;
  container.appendChild(warning);
  console.error("WebGL not supported");
} else {
  try {
    initScene();
  } catch (error) {
    console.error("Error initializing WebGL scene:", error);
    const errorMessage = document.createElement("div");
    errorMessage.className =
      "p-6 bg-red-600 text-white rounded shadow-lg absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2";
    errorMessage.textContent =
      "Failed to initialize 3D scene. Error: " + error.message;
    container.appendChild(errorMessage);
  }
}

function initScene() {
  // Initialize scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  // Initialize camera
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(5, 5, 10);

  // Initialize renderer
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "default",
    failIfMajorPerformanceCaveat: false,
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // Add lights
  const ambientLight = new THREE.AmbientLight(0x404040, 1);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 7);
  scene.add(directionalLight);

  // Add controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Create grid helper
  const gridHelper = new THREE.GridHelper(20, 20);
  scene.add(gridHelper);

  // Create room with default dimensions (will be updated by dashboard)
  const room = new Room(10, 10, 3);
  room.render(scene);

  // Initialize dashboard
  const dashboard = new Dashboard(scene, camera, renderer, room);

  // Handle window resize
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  animate();
}
