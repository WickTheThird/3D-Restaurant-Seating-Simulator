import * as THREE from "three";
import Table from "./Table";

class RoundTable extends Table {
  constructor(radius, height = 0.75) {
    super();
    this.radius = radius;
    this.height = height;

    // Create table mesh
    const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      emissive: new THREE.Color(0x000000),
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.y = height / 2;

    // Add user data for identification
    this.mesh.userData = {
      type: "roundTable",
      radius: radius,
      height: height,
    };
  }

  set position(pos) {
    if (!this.mesh) return; // Safety check

    this.mesh.position.x = pos.x;
    this.mesh.position.z = pos.z;
    this.mesh.position.y = this.height / 2; // Maintain height
  }

  get position() {
    return this.mesh ? this.mesh.position : new THREE.Vector3();
  }

  // Override move method with specific behavior
  move(x, z) {
    if (!this.mesh) return false;

    this.mesh.position.x = x;
    this.mesh.position.z = z;
    this.mesh.position.y = this.height / 2; // Maintain height

    return true;
  }

  render(scene) {
    if (this.mesh) {
      scene.add(this.mesh);
    }
  }
}

export default RoundTable;
