import * as THREE from "three";

class Person {
  constructor(name, position) {
    this.name = name;
    this.position = position ? position.clone() : new THREE.Vector3();
    this.mesh = null;
    this.textSprite = null;
  }

  render(scene) {
    // Create person mesh (simple cylinder for body)
    const bodyGeometry = new THREE.CylinderGeometry(0.25, 0.25, 1.7, 16);
    const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0x00a0ff });

    // Create body and head
    this.mesh = new THREE.Group();
    const body = new THREE.Mesh(bodyGeometry, material);
    const head = new THREE.Mesh(headGeometry, material);

    // Position head above body
    head.position.y = 1.1;

    // Add to group
    this.mesh.add(body);
    this.mesh.add(head);

    // Position the person
    this.mesh.position.copy(this.position);
    this.mesh.position.y += 0.85; // Move up to stand on ground

    // Create text for name
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = 256;
    canvas.height = 128;

    // Style the text
    context.font = "Bold 24px Arial";
    context.fillStyle = "rgba(255,255,255,1)";
    context.textAlign = "center";
    context.fillText(this.name, 128, 64);

    // Create sprite for name
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    this.textSprite = new THREE.Sprite(spriteMaterial);

    // Scale and position the text
    this.textSprite.scale.set(2, 1, 1);
    this.textSprite.position.copy(this.mesh.position);
    this.textSprite.position.y += 2.2;

    // Add to scene
    scene.add(this.mesh);
    scene.add(this.textSprite);
  }
}

export default Person;
