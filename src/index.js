import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import SceneManager from "./utils/SceneManager";
import Room from "./components/Room";

// Check WebGL support first
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
const container = document.getElementById("app") || document.body;

// Display error message if WebGL isn't available
if (!webglAvailable()) {
  const warning = document.createElement("div");
  warning.style.position = "absolute";
  warning.style.top = "50%";
  warning.style.left = "50%";
  warning.style.transform = "translate(-50%, -50%)";
  warning.style.textAlign = "center";
  warning.style.padding = "20px";
  warning.style.background = "rgba(255,0,0,0.6)";
  warning.style.color = "white";
  warning.style.fontFamily = "Arial, sans-serif";
  warning.style.borderRadius = "5px";
  warning.innerHTML = `
    <h2>WebGL Not Available</h2>
    <p>Your browser or device doesn't support WebGL, which is required for the 3D restaurant simulator.</p>
    <p>Please try:</p>
    <ul style="text-align: left;">
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
    errorMessage.style.color = "red";
    errorMessage.style.padding = "20px";
    errorMessage.textContent =
      "Failed to initialize 3D scene. Error: " + error.message;
    container.appendChild(errorMessage);
  }
}

function initScene() {
  // Initialize scene, camera, renderer
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(5, 5, 10);

  // Try with explicit WebGL1 if WebGL2 fails
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "default",
    failIfMajorPerformanceCaveat: false,
    canvas: document.createElement("canvas"),
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
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

  // Create grid helper for reference
  const gridHelper = new THREE.GridHelper(20, 20);
  scene.add(gridHelper);

  // Create room and objects
  const room = new Room(10, 10, 3);
  room.render(scene);

  const table1 = room.addRectangularTable(-2, -2, 2, 1);
  const table2 = room.addRoundTable(2, 2, 1);
  const seat = room.addSeat(0, 0);
  room.addPerson("Guest", seat);

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  animate();
}
