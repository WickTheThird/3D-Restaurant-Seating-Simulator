import * as THREE from "three";

class Seat {
  constructor() {
    this.mesh = null;
    this.position = new THREE.Vector3();
    this.isMoving = false;
    this._originalEmissive = null;
  }

  render(scene) {
    // Create seat geometry (cylindrical seat instead of cube)
    const geometry = new THREE.CylinderGeometry(0.25, 0.25, 0.5, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0x333333,
      emissive: new THREE.Color(0x000000),
    });
    this.mesh = new THREE.Mesh(geometry, material);

    // Position the seat
    this.mesh.position.copy(this.position);
    this.mesh.position.y = 0.25; // Half the height

    // Add user data for identification
    this.mesh.userData = {
      type: "seat",
      height: 0.5,
    };

    scene.add(this.mesh);
  }

  // Add movement methods similar to Table class
  move(x, z) {
    if (this.mesh) {
      this.position.x = x;
      this.position.z = z;
      this.mesh.position.x = x;
      this.mesh.position.z = z;
      this.mesh.position.y = 0.25; // Maintain height
      return true;
    }
    return false;
  }

  startMoving() {
    this.isMoving = true;
    if (this.mesh && this.mesh.material) {
      // Store original material properties
      this._originalEmissive = this.mesh.material.emissive
        ? this.mesh.material.emissive.clone()
        : null;

      // Highlight the object
      if (this.mesh.material.emissive) {
        this.mesh.material.emissive.set(0x555555);
      }
    }
    return true;
  }

  stopMoving() {
    this.isMoving = false;
    if (this.mesh && this.mesh.material && this._originalEmissive) {
      // Restore original material
      this.mesh.material.emissive.copy(this._originalEmissive);
      this._originalEmissive = null;
    }
    return true;
  }
}

export default Seat;
