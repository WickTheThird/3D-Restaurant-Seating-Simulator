import * as THREE from "three";

class Table {
  constructor() {
    this.mesh = null;
    this.isMoving = false;
  }

  render(scene) {
    if (this.mesh) {
      scene.add(this.mesh);
    }
  }

  get position() {
    if (this.mesh) {
      return this.mesh.position;
    }
    return new THREE.Vector3();
  }

  set position(pos) {
    console.warn("Position setter called on base Table class");
  }

  // New method for movement
  move(x, z) {
    if (this.mesh) {
      this.mesh.position.x = x;
      this.mesh.position.z = z;
      // Keep y position unchanged to maintain height
      return true;
    }
    return false;
  }

  // New method to start movement mode
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

  // New method to stop movement mode
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

export default Table;
