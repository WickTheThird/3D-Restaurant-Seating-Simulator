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

  addRectangularTable(x, z, width, length) {
    const table = new RectangularTable(width, length);

    // Only set position after table is fully constructed
    table.position.set(x, 0, z);

    this.tables.push(table);
    // REMOVE: table.render(this.scene); - We'll render it in the render() method instead
    return table;
  }

  addRoundTable(x, z, radius) {
    const table = new RoundTable(radius);

    table.position.set(x, 0, z);

    this.tables.push(table);
    // REMOVE: table.render(this.scene); - We'll render it in the render() method instead
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

  render(scene) {
    scene.add(this.roomMesh);
    this.tables.forEach((table) => table.render(scene));
    this.seats.forEach((seat) => seat.render(scene));
    this.people.forEach((person) => person.render(scene));
  }
}

export default Room;
