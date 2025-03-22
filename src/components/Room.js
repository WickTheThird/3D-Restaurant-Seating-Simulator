import * as THREE from "three";
import RectangularTable from "./Table/RectangularTable";
import RoundTable from "./Table/RoundTable";
import Seat from "./Seat";
import Person from "./Person";

class Room {
  constructor(width, length, height) {
    this.width = width;
    this.length = length;
    this.height = height;
    this.tables = [];
    this.seats = [];
    this.people = [];
    this.roomMesh = this.createRoomMesh();
  }

  createRoomMesh() {
    const geometry = new THREE.BoxGeometry(
      this.width,
      this.height,
      this.length
    );
    const material = new THREE.MeshBasicMaterial({
      color: 0xcccccc,
      wireframe: true,
    });
    const roomMesh = new THREE.Mesh(geometry, material);
    roomMesh.position.set(0, this.height / 2, 0);
    return roomMesh;
  }

  addRectangularTable(x, z, width, length, height = 0.75) {
    const table = new RectangularTable(width, length, height);
    table.position.set(x, 0, z);
    this.tables.push(table);
    return table;
  }

  addRoundTable(x, z, radius, height = 0.75) {
    const table = new RoundTable(radius, height);
    table.position.set(x, 0, z);
    this.tables.push(table);
    return table;
  }

  addSeat(x, z) {
    const seat = new Seat();
    seat.position.set(x, 0, z);
    this.seats.push(seat);
    return seat;
  }

  addPerson(name, seat) {
    const person = new Person(name, seat.position);
    this.people.push(person);
    return person;
  }


  moveObject(object, x, z) {
    if (!object) return false;

    // Update the position
    object.position.x = x;
    object.position.z = z;

    // If the object has a mesh property, update that as well
    if (object.mesh) {
      object.mesh.position.x = x;
      object.mesh.position.z = z;

      // Force matrix world update
      object.mesh.updateMatrix();
      object.mesh.updateMatrixWorld(true);
    }

    // If object has a specific move method, call it
    if (typeof object.move === "function") {
      object.move(x, z);
    }

    // If it's a person, update their seat position as well
    if (object instanceof Person && object.seat) {
      object.seat.position.x = x;
      object.seat.position.z = z;
    }

    return true;
  }

  /**
   * Find an object by its ID
   * @param {string} id - The object ID to find
   * @returns {Object|null} - The found object or null
   */
  findObjectById(id) {
    // Look in tables
    const table = this.tables.find((t) => t.id === id);
    if (table) return table;

    // Look in seats
    const seat = this.seats.find((s) => s.id === id);
    if (seat) return seat;

    // Look in people
    const person = this.people.find((p) => p.id === id);
    if (person) return person;

    return null;
  }

  moveObjectById(id, x, z) {
    const object = this.findObjectById(id);
    if (!object) return false;

    return this.moveObject(object, x, z);
  }

  isValidPosition(x, z, radius = 0.5, excludeObject = null) {
    // Check room bounds (accounting for radius)
    if (
      x - radius < -this.width / 2 ||
      x + radius > this.width / 2 ||
      z - radius < -this.length / 2 ||
      z + radius > this.length / 2
    ) {
      return false;
    }

    // Check collisions with other objects
    // (This would be more sophisticated in a real implementation)

    return true;
  }

  render(scene) {
    scene.add(this.roomMesh);
    this.tables.forEach((table) => table.render(scene));
    this.seats.forEach((seat) => seat.render(scene));
    this.people.forEach((person) => person.render(scene));
  }
}

export default Room;
