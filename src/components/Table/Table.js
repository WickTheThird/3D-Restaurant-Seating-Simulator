import * as THREE from "three";

class Table {
  constructor() {
    this.mesh = null;
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
}

export default Table;
