import * as THREE from "three";
import { DragControls } from "three/examples/jsm/controls/DragControls.js";

class Dashboard {
  constructor(scene, camera, renderer, room) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.room = room;

    this.selectedObject = null;
    this.objectCounter = 1;
    this.dragPlaceholder = null;
    this.dragControls = null;
    this.draggableObjects = [];

    this.init();
  }

  init() {
    document
      .getElementById("create-room-btn")
      .addEventListener("click", () => this.createRoom());

    this.initDashboard();
    this.initDragAndDrop();
    this.initObjectManipulation();
  }

  initObjectManipulation() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    this.renderer.domElement.addEventListener("click", (event) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, this.camera);

      const intersects = raycaster.intersectObjects(this.draggableObjects);

      if (intersects.length > 0) {
        const mesh = intersects[0].object;
        let object;

        if (
          mesh.userData.type === "rectangularTable" ||
          mesh.userData.type === "roundTable"
        ) {
          object = this.room.tables.find((t) => t.mesh === mesh);
        } else if (mesh.userData.type === "seat") {
          object = this.room.seats.find((s) => s.mesh === mesh);
        }

        if (object) {
          this.selectObject(object);
        }
      } else {
        // Clicked on empty space, deselect
        this.selectObject(null);
      }
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Delete" && this.selectedObject) {
        this.deleteSelectedObject();
      }
      // Could add more keyboard shortcuts here
    });
  }

  createRoom() {
    const width = parseFloat(document.getElementById("room-width").value);
    const length = parseFloat(document.getElementById("room-length").value);
    const height = parseFloat(document.getElementById("room-height").value);

    // Hide modal and show dashboard
    document.getElementById("room-setup-modal").classList.add("hidden");
    document.getElementById("dashboard").classList.remove("hidden");

    // Update room dimensions
    this.room.width = width;
    this.room.length = length;
    this.room.height = height;

    // Recreate room mesh with new dimensions
    this.scene.remove(this.room.roomMesh);
    this.room.roomMesh = this.room.createRoomMesh();
    this.scene.add(this.room.roomMesh);
  }

  initDashboard() {
    // Object button handlers
    document
      .getElementById("update-object-btn")
      .addEventListener("click", () => this.updateSelectedObject());
    document
      .getElementById("delete-object-btn")
      .addEventListener("click", () => this.deleteSelectedObject());

    // Table seat management
    document
      .getElementById("add-rect-seat-btn")
      .addEventListener("click", () => this.addSeatToTable("rectangular"));
    document
      .getElementById("add-round-seat-btn")
      .addEventListener("click", () => this.addSeatToTable("round"));

    // Color preview handlers
    document.getElementById("rect-color").addEventListener("input", (e) => {
      document.getElementById("rect-color-preview").style.backgroundColor =
        e.target.value;
    });
    document.getElementById("round-color").addEventListener("input", (e) => {
      document.getElementById("round-color-preview").style.backgroundColor =
        e.target.value;
    });
  }

  initDragAndDrop() {
    const draggableItems = document.querySelectorAll(".draggable-item");

    draggableItems.forEach((item) => {
      item.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("objectType", item.dataset.objectType);
      });

      // Make items draggable
      item.setAttribute("draggable", "true");
    });

    // Handle drag over scene
    const sceneContainer = document.getElementById("scene-container");

    sceneContainer.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    });

    // Handle drop on scene
    sceneContainer.addEventListener("drop", (e) => {
      e.preventDefault();
      const objectType = e.dataTransfer.getData("objectType");

      // Calculate drop position in 3D space using raycasting
      const rect = sceneContainer.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / sceneContainer.offsetWidth) * 2 - 1;
      const y = -((e.clientY - rect.top) / sceneContainer.offsetHeight) * 2 + 1;

      this.createObjectAtPosition(objectType, x, y);
    });

    // Initialize drag controls for 3D objects
    this.initDragControls();
  }

  createObjectAtPosition(objectType, screenX, screenY) {
    // Use raycasting to find the intersection with the floor plane
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(screenX, screenY);
    raycaster.setFromCamera(mouse, this.camera);

    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(floorPlane, intersection);

    let object;

    // Create object based on type
    switch (objectType) {
      case "rectangularTable":
        object = this.room.addRectangularTable(
          intersection.x,
          intersection.z,
          1.5,
          2
        );
        object.userData = {
          type: "rectangularTable",
          name: `Table ${this.objectCounter++}`,
          seats: [],
        };
        break;

      case "roundTable":
        object = this.room.addRoundTable(intersection.x, intersection.z, 1);
        object.userData = {
          type: "roundTable",
          name: `Round Table ${this.objectCounter++}`,
          seats: [],
        };
        break;

      case "seat":
        object = this.room.addSeat(intersection.x, intersection.z);
        object.userData = {
          type: "seat",
          name: `Seat ${this.objectCounter++}`,
          personName: "",
        };
        break;
    }

    // Add to scene and make draggable
    if (object && object.mesh) {
      this.draggableObjects.push(object.mesh);
      this.updateDragControls();
      this.updateObjectList();
      this.selectObject(object);
    }
  }

  initDragControls() {
    // Create drag controls
    this.dragControls = new DragControls(
      this.draggableObjects,
      this.camera,
      this.renderer.domElement
    );

    // Constrain to XZ plane
    this.dragControls.addEventListener("drag", (event) => {
      const object = event.object;
      object.position.y = object.userData.height / 2 || 0.5; // Keep at original height

      // Constrain to room bounds
      const halfWidth = this.room.width / 2;
      const halfLength = this.room.length / 2;

      let objWidth = 0,
        objLength = 0;

      if (object.userData.type === "rectangularTable") {
        objWidth = object.userData.width / 2 || 0.75;
        objLength = object.userData.length / 2 || 1;
      } else if (object.userData.type === "roundTable") {
        objWidth = objLength = object.userData.radius || 0.5;
      } else if (object.userData.type === "seat") {
        objWidth = objLength = 0.25;
      }

      object.position.x = Math.max(
        -halfWidth + objWidth,
        Math.min(halfWidth - objWidth, object.position.x)
      );
      object.position.z = Math.max(
        -halfLength + objLength,
        Math.min(halfLength - objLength, object.position.z)
      );

      // Update object data
      this.updateObjectPosition(object);
    });
  }

  updateDragControls() {
    // Update the objects for drag controls
    if (this.dragControls) {
      this.dragControls.dispose();
      this.dragControls = new DragControls(
        this.draggableObjects,
        this.camera,
        this.renderer.domElement
      );
    }
  }

  updateObjectPosition(object) {
    // Find corresponding object in the room
    const objType = object.userData.type;
    let roomObject;

    switch (objType) {
      case "rectangularTable":
      case "roundTable":
        roomObject = this.room.tables.find((t) => t.mesh === object);
        break;
      case "seat":
        roomObject = this.room.seats.find((s) => s.mesh === object);
        break;
    }

    if (roomObject) {
      roomObject.position.copy(object.position);

      // Update seat positions if this is a table with attached seats
      if (object.userData.seats && object.userData.seats.length > 0) {
        this.updateTableSeatsPositions(roomObject);
      }
    }
  }

  updateTableSeatsPositions(table) {
    if (
      !table.userData ||
      !table.userData.seats ||
      !table.userData.seats.length
    )
      return;

    const seats = table.userData.seats;
    const tablePosition = table.position.clone();

    if (table.userData.type === "rectangularTable") {
      const width = table.userData.width || 1.5;
      const length = table.userData.length || 2;

      // Position seats around the rectangular table
      const halfWidth = width / 2 + 0.3; // Add offset
      const halfLength = length / 2 + 0.3; // Add offset

      const sides = [
        { x: 0, z: -halfLength }, // North
        { x: halfWidth, z: 0 }, // East
        { x: 0, z: halfLength }, // South
        { x: -halfWidth, z: 0 }, // West
      ];

      const seatsPerSide = Math.ceil(seats.length / 4);

      seats.forEach((seatId, index) => {
        const sideIndex = Math.floor(index / seatsPerSide);
        const posInSide = index % seatsPerSide;

        const side = sides[sideIndex % 4];

        let seatObject = this.room.seats.find((s) => s.id === seatId);
        if (seatObject) {
          let offsetX = 0,
            offsetZ = 0;

          if (sideIndex % 2 === 0) {
            // North/South sides
            const sideWidth = width - 0.6; // Leave space at corners
            offsetX =
              -sideWidth / 2 +
              posInSide * (sideWidth / (seatsPerSide - 1 || 1));
          } else {
            // East/West sides
            const sideLength = length - 0.6; // Leave space at corners
            offsetZ =
              -sideLength / 2 +
              posInSide * (sideLength / (seatsPerSide - 1 || 1));
          }

          seatObject.position.set(
            tablePosition.x + side.x + offsetX,
            0,
            tablePosition.z + side.z + offsetZ
          );

          // Update seat mesh position
          if (seatObject.mesh) {
            seatObject.mesh.position.copy(seatObject.position);
            seatObject.mesh.position.y = 0.25; // Half height of seat
          }
        }
      });
    } else if (table.userData.type === "roundTable") {
      const radius = table.userData.radius || 1;
      const seatRadius = radius + 0.3; // Offset from table edge

      seats.forEach((seatId, index) => {
        const angle = (index / seats.length) * Math.PI * 2;
        const seatX = tablePosition.x + Math.sin(angle) * seatRadius;
        const seatZ = tablePosition.z + Math.cos(angle) * seatRadius;

        let seatObject = this.room.seats.find((s) => s.id === seatId);
        if (seatObject) {
          seatObject.position.set(seatX, 0, seatZ);

          // Update seat mesh position
          if (seatObject.mesh) {
            seatObject.mesh.position.copy(seatObject.position);
            seatObject.mesh.position.y = 0.25; // Half height of seat
          }
        }
      });
    }
  }

  updateObjectList() {
    const objectList = document.getElementById("object-list");
    objectList.innerHTML = "";

    // Add tables
    this.room.tables.forEach((table) => {
      this.addObjectToList(table, table.userData?.name || "Table");
    });

    // Add standalone seats (not attached to tables)
    this.room.seats.forEach((seat) => {
      // Only add if not attached to a table
      const isAttached = this.room.tables.some((table) =>
        table.userData?.seats?.includes(seat.id)
      );

      if (!isAttached) {
        this.addObjectToList(seat, seat.userData?.name || "Seat");
      }
    });
  }

  addObjectToList(object, name) {
    const objectList = document.getElementById("object-list");

    const listItem = document.createElement("li");
    listItem.className =
      "flex justify-between items-center p-2 hover:bg-gray-100 rounded";
    if (this.selectedObject === object) {
      listItem.classList.add("bg-blue-100");
    }

    const objectName = document.createElement("span");
    objectName.textContent = name;
    objectName.className = "cursor-pointer flex-grow";
    objectName.addEventListener("click", () => this.selectObject(object));

    const actions = document.createElement("div");
    actions.className = "flex space-x-1";

    const editBtn = document.createElement("button");
    editBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>`;
    editBtn.className = "text-blue-500 hover:text-blue-700 p-1";
    editBtn.addEventListener("click", () => this.selectObject(object));

    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>`;
    deleteBtn.className = "text-red-500 hover:text-red-700 p-1";
    deleteBtn.addEventListener("click", () => this.deleteObject(object));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    listItem.appendChild(objectName);
    listItem.appendChild(actions);

    objectList.appendChild(listItem);
  }

  selectObject(object) {
    // Deselect previous object
    if (this.selectedObject && this.selectedObject.mesh) {
      if (this.selectedObject.mesh.material.emissive) {
        this.selectedObject.mesh.material.emissive.setHex(0x000000);
      }
    }

    this.selectedObject = object;

    // Highlight selected object
    if (object && object.mesh) {
      if (object.mesh.material.emissive) {
        object.mesh.material.emissive.setHex(0x333333);
      }
    }

    // Show properties panel
    this.showObjectProperties(object);

    // Update object list to show selection
    this.updateObjectList();
  }

  showObjectProperties(object) {
    if (!object) {
      document
        .getElementById("no-selection-message")
        .classList.remove("hidden");
      document.getElementById("property-editor").classList.add("hidden");
      return;
    }

    document.getElementById("no-selection-message").classList.add("hidden");
    document.getElementById("property-editor").classList.remove("hidden");

    // Hide all property groups
    document.getElementById("rectangular-table-props").classList.add("hidden");
    document.getElementById("round-table-props").classList.add("hidden");
    document.getElementById("seat-props").classList.add("hidden");

    // Set common properties
    document.getElementById("object-name").value = object.userData?.name || "";

    // Show relevant property group
    if (object.userData?.type === "rectangularTable") {
      // Show rectangular table properties
      document
        .getElementById("rectangular-table-props")
        .classList.remove("hidden");

      // Set values
      document.getElementById("rect-width").value =
        object.userData?.width || 1.5;
      document.getElementById("rect-length").value =
        object.userData?.length || 2;
      document.getElementById("rect-height").value =
        object.userData?.height || 0.75;

      const color = object.mesh?.material.color;
      if (color) {
        const hexColor = "#" + color.getHexString();
        document.getElementById("rect-color").value = hexColor;
        document.getElementById("rect-color-preview").style.backgroundColor =
          hexColor;
      }

      // Update seats list
      this.updateSeatsList("rectangular", object);
    } else if (object.userData?.type === "roundTable") {
      // Show round table properties
      document.getElementById("round-table-props").classList.remove("hidden");

      // Set values
      document.getElementById("round-radius").value =
        object.userData?.radius || 1;
      document.getElementById("round-height").value =
        object.userData?.height || 0.75;

      const color = object.mesh?.material.color;
      if (color) {
        const hexColor = "#" + color.getHexString();
        document.getElementById("round-color").value = hexColor;
        document.getElementById("round-color-preview").style.backgroundColor =
          hexColor;
      }

      // Update seats list
      this.updateSeatsList("round", object);
    } else if (object.userData?.type === "seat") {
      // Show seat properties
      document.getElementById("seat-props").classList.remove("hidden");

      // Set values
      document.getElementById("person-name").value =
        object.userData?.personName || "";
    }
  }

  updateSeatsList(tableType, tableObject) {
    const containerId =
      tableType === "rectangular"
        ? "rect-seats-container"
        : "round-seats-container";
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    if (
      !tableObject.userData?.seats ||
      tableObject.userData.seats.length === 0
    ) {
      container.innerHTML =
        '<div class="text-gray-500 italic text-xs p-1">No seats attached</div>';
      return;
    }

    // Create list of seats
    tableObject.userData.seats.forEach((seatId, index) => {
      const seat = this.room.seats.find((s) => s.id === seatId);
      if (!seat) return;

      const seatItem = document.createElement("div");
      seatItem.className =
        "flex items-center justify-between py-1 border-b border-gray-200 last:border-0";

      const seatInfo = document.createElement("div");
      seatInfo.className = "flex items-center";

      const seatNumber = document.createElement("span");
      seatNumber.textContent = `${index + 1}.`;
      seatNumber.className = "text-xs font-bold mr-2";

      const seatName = document.createElement("span");
      seatName.textContent = seat.userData?.personName || "Empty";
      seatName.className = "text-sm";

      seatInfo.appendChild(seatNumber);
      seatInfo.appendChild(seatName);

      const actions = document.createElement("div");
      actions.className = "flex space-x-1";

      const editBtn = document.createElement("button");
      editBtn.innerHTML = `<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>`;
      editBtn.className = "text-blue-500 hover:text-blue-700 p-1 text-xs";
      editBtn.addEventListener("click", () => this.selectObject(seat));

      const upBtn = document.createElement("button");
      upBtn.innerHTML = `<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path></svg>`;
      upBtn.className = "text-gray-500 hover:text-gray-700 p-1 text-xs";
      upBtn.addEventListener("click", () =>
        this.moveSeat(tableObject, index, "up")
      );

      const downBtn = document.createElement("button");
      downBtn.innerHTML = `<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>`;
      downBtn.className = "text-gray-500 hover:text-gray-700 p-1 text-xs";
      downBtn.addEventListener("click", () =>
        this.moveSeat(tableObject, index, "down")
      );

      const deleteBtn = document.createElement("button");
      deleteBtn.innerHTML = `<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>`;
      deleteBtn.className = "text-red-500 hover:text-red-700 p-1 text-xs";
      deleteBtn.addEventListener("click", () =>
        this.removeSeatFromTable(tableObject, seatId)
      );

      actions.appendChild(editBtn);
      actions.appendChild(upBtn);
      actions.appendChild(downBtn);
      actions.appendChild(deleteBtn);

      seatItem.appendChild(seatInfo);
      seatItem.appendChild(actions);

      container.appendChild(seatItem);
    });
  }

  addSeatToTable(tableType) {
    if (
      !this.selectedObject ||
      (tableType === "rectangular" &&
        this.selectedObject.userData?.type !== "rectangularTable") ||
      (tableType === "round" &&
        this.selectedObject.userData?.type !== "roundTable")
    ) {
      return;
    }

    // Create new seat
    const tablePosition = this.selectedObject.position.clone();
    let offsetX = 0,
      offsetZ = 0;

    if (tableType === "rectangular") {
      offsetX = this.selectedObject.userData?.width / 2 + 0.3 || 1;
    } else {
      offsetX = this.selectedObject.userData?.radius + 0.3 || 1.3;
    }

    const seat = this.room.addSeat(tablePosition.x + offsetX, tablePosition.z);
    seat.userData = {
      type: "seat",
      name: `Seat ${this.objectCounter++}`,
      personName: "",
    };

    seat.id = Date.now(); // Unique ID for referencing

    // Add to draggable objects
    if (seat.mesh) {
      this.draggableObjects.push(seat.mesh);
      this.updateDragControls();
    }

    // Add to table's seats list
    if (!this.selectedObject.userData.seats) {
      this.selectedObject.userData.seats = [];
    }

    this.selectedObject.userData.seats.push(seat.id);

    // Update positions of all seats
    this.updateTableSeatsPositions(this.selectedObject);

    // Update UI
    this.updateSeatsList(tableType, this.selectedObject);
    this.updateObjectList();
  }

  moveSeat(tableObject, seatIndex, direction) {
    if (!tableObject || !tableObject.userData?.seats) return;

    const seats = tableObject.userData.seats;

    if (direction === "up" && seatIndex > 0) {
      // Move up (swap with previous)
      [seats[seatIndex], seats[seatIndex - 1]] = [
        seats[seatIndex - 1],
        seats[seatIndex],
      ];
    } else if (direction === "down" && seatIndex < seats.length - 1) {
      // Move down (swap with next)
      [seats[seatIndex], seats[seatIndex + 1]] = [
        seats[seatIndex + 1],
        seats[seatIndex],
      ];
    }

    // Update positions
    this.updateTableSeatsPositions(tableObject);

    // Update UI
    const tableType =
      tableObject.userData.type === "rectangularTable"
        ? "rectangular"
        : "round";
    this.updateSeatsList(tableType, tableObject);
  }

  removeSeatFromTable(tableObject, seatId) {
    if (!tableObject || !tableObject.userData?.seats) return;

    // Remove from seats array
    tableObject.userData.seats = tableObject.userData.seats.filter(
      (id) => id !== seatId
    );

    // Update positions
    this.updateTableSeatsPositions(tableObject);

    // Update UI
    const tableType =
      tableObject.userData.type === "rectangularTable"
        ? "rectangular"
        : "round";
    this.updateSeatsList(tableType, tableObject);
    this.updateObjectList();
  }

  updateSelectedObject() {
    if (!this.selectedObject) return;

    const type = this.selectedObject.userData?.type;

    // Update common properties
    this.selectedObject.userData.name =
      document.getElementById("object-name").value;

    if (type === "rectangularTable") {
      // Update rectangular table properties
      const width = parseFloat(document.getElementById("rect-width").value);
      const length = parseFloat(document.getElementById("rect-length").value);
      const height = parseFloat(document.getElementById("rect-height").value);
      const color = document.getElementById("rect-color").value;

      // Store original values
      this.selectedObject.userData.width = width;
      this.selectedObject.userData.length = length;
      this.selectedObject.userData.height = height;

      // Recreate the mesh with new dimensions
      const oldMesh = this.selectedObject.mesh;
      const oldPosition = oldMesh.position.clone();

      // Update object parameters
      this.scene.remove(oldMesh);

      // Update index in draggable objects
      const index = this.draggableObjects.indexOf(oldMesh);
      if (index !== -1) {
        this.draggableObjects.splice(index, 1);
      }

      // Create new geometry and material
      const geometry = new THREE.BoxGeometry(width, height, length);
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        emissive: new THREE.Color(0x333333),
      });

      const newMesh = new THREE.Mesh(geometry, material);
      newMesh.position.copy(oldPosition);
      newMesh.userData = this.selectedObject.userData;

      // Update the selectedObject reference
      this.selectedObject.mesh = newMesh;
      this.scene.add(newMesh);
      this.draggableObjects.push(newMesh);

      // Update seat positions
      this.updateTableSeatsPositions(this.selectedObject);
    } else if (type === "roundTable") {
      // Update round table properties
      const radius = parseFloat(document.getElementById("round-radius").value);
      const height = parseFloat(document.getElementById("round-height").value);
      const color = document.getElementById("round-color").value;

      // Store original values
      this.selectedObject.userData.radius = radius;
      this.selectedObject.userData.height = height;

      // Recreate the mesh with new dimensions
      const oldMesh = this.selectedObject.mesh;
      const oldPosition = oldMesh.position.clone();

      // Update object parameters
      this.scene.remove(oldMesh);

      // Update index in draggable objects
      const index = this.draggableObjects.indexOf(oldMesh);
      if (index !== -1) {
        this.draggableObjects.splice(index, 1);
      }

      // Create new geometry and material
      const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        emissive: new THREE.Color(0x333333),
      });

      const newMesh = new THREE.Mesh(geometry, material);
      newMesh.position.copy(oldPosition);
      newMesh.userData = this.selectedObject.userData;

      // Update the selectedObject reference
      this.selectedObject.mesh = newMesh;
      this.scene.add(newMesh);
      this.draggableObjects.push(newMesh);

      // Update seat positions
      this.updateTableSeatsPositions(this.selectedObject);
    } else if (type === "seat") {
      // Update seat properties
      const personName = document.getElementById("person-name").value;
      this.selectedObject.userData.personName = personName;

      // Update person above seat if needed
      if (personName) {
        const person = this.room.people.find(
          (p) => p.seat === this.selectedObject
        );
        if (person) {
          person.name = personName;
        } else {
          this.room.addPerson(personName, this.selectedObject);
        }
      }
    }

    // Update the UI
    this.updateObjectList();
    this.updateDragControls();
  }

  deleteSelectedObject() {
    if (!this.selectedObject) return;

    this.deleteObject(this.selectedObject);
  }

  deleteObject(object) {
    const type = object.userData?.type;

    // Remove from scene
    if (object.mesh) {
      this.scene.remove(object.mesh);

      // Remove from draggable objects
      const index = this.draggableObjects.indexOf(object.mesh);
      if (index !== -1) {
        this.draggableObjects.splice(index, 1);
      }
    }

    // Remove from room arrays
    if (type === "rectangularTable" || type === "roundTable") {
      this.room.tables = this.room.tables.filter((t) => t !== object);

      // Check for attached seats to remove
      if (object.userData?.seats) {
        object.userData.seats.forEach((seatId) => {
          const seat = this.room.seats.find((s) => s.id === seatId);
          if (seat) this.deleteObject(seat);
        });
      }
    } else if (type === "seat") {
      this.room.seats = this.room.seats.filter((s) => s !== object);

      // Remove person attached to seat
      this.room.people = this.room.people.filter((p) => p.seat !== object);

      // Remove from any table's seat list
      this.room.tables.forEach((table) => {
        if (table.userData?.seats) {
          table.userData.seats = table.userData.seats.filter(
            (id) => id !== object.id
          );
        }
      });
    }

    // If this was the selected object, deselect
    if (this.selectedObject === object) {
      this.selectObject(null);
    }

    // Update UI
    this.updateObjectList();
    this.updateDragControls();
  }
}

export default Dashboard;
