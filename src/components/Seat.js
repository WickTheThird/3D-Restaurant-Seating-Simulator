import * as THREE from "three";

class Seat {
  constructor() {
    this.mesh = null;
    this.position = new THREE.Vector3();
  }

  render(scene) {
    // Create seat geometry (simple cube)
    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const material = new THREE.MeshBasicMaterial({ color: 0xa52a2a });
    this.mesh = new THREE.Mesh(geometry, material);

    // Position the seat
    this.mesh.position.copy(this.position);
    this.mesh.position.y = 0.25; // Half the height

    scene.add(this.mesh);
  }
}

export default Seat;
