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
    this.useSafeDragControls = true;

    // Make dashboard accessible globally for debugging
    window._dashboard = this;

    console.log("Dashboard initialized");
    this.init();
  }

  init() {
    this.safeAddEventListener("create-room-btn", "click", () =>
      this.createRoom()
    );
    this.safeAddEventListener("toggle-dashboard", "click", () =>
      this.toggleDashboard()
    );
    this.initDashboard();
    this.initDragAndDrop();
    this.initObjectManipulation();
    this.addClickToAddFunctionality();
  }

  // NEW: Add click-to-add functionality for easier object creation
  addClickToAddFunctionality() {
    const draggableItems = document.querySelectorAll(".draggable-item");
    console.log(
      `Setting up click handlers for ${draggableItems.length} draggable items`
    );

    draggableItems.forEach((item) => {
      item.addEventListener("click", () => {
        const objectType = item.dataset.objectType;
        console.log(`Click to add ${objectType}`);

        // Add the object to the center of the room
        this.addObjectAtCenterPosition(objectType);
      });
    });
  }

  // NEW: Add object at center of room (helper for click-to-add)
  addObjectAtCenterPosition(objectType) {
    console.log(`Adding ${objectType} at center position`);
    try {
      let object;

      // Create object based on type
      switch (objectType) {
        case "rectangularTable":
          object = this.createRectTableAtPosition(0, 0, 1.5, 2);
          break;

        case "roundTable":
          object = this.createRoundTableAtPosition(0, 0, 1);
          break;

        case "seat":
          object = this.createSeatAtPosition(0, 0);
          break;
      }

      // Add to scene and make draggable
      if (object && object.mesh) {
        // Force a render cycle to ensure object is properly initialized
        this.renderer.render(this.scene, this.camera);

        // Wait briefly to ensure object is initialized properly in Three.js
        setTimeout(() => {
          // Double check that the mesh is valid before adding
          if (object.mesh && object.mesh.matrixWorld) {
            this.draggableObjects.push(object.mesh);

            // Update controls
            try {
              this.updateDragControls();
            } catch (err) {
              console.warn("Error updating drag controls:", err);
            }

            this.updateObjectList();
            this.selectObject(object);
            console.log(`Successfully created ${objectType} at center`);
          }
        }, 100);

        // Show dashboard to see the new object
        this.showDashboard();
      } else {
        console.error(`Failed to create ${objectType}`);
      }
    } catch (error) {
      console.error("Error adding object at center:", error);
    }
  }

  // Helper methods to create objects without depending on Room.js implementation
  createRectTableAtPosition(x, z, width, length) {
    try {
      // Create geometry and material directly
      const height = 0.75;
      const geometry = new THREE.BoxGeometry(width, height, length);
      const material = new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        emissive: 0x000000,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, height / 2, z);
      mesh.updateMatrix();
      mesh.updateMatrixWorld(true);

      mesh.userData = {
        type: "rectangularTable",
        name: `Table ${this.objectCounter++}`,
        seats: [],
        width: width,
        length: length,
        height: height,
      };

      // Add to scene
      this.scene.add(mesh);

      // Create the object to return
      const table = {
        mesh: mesh,
        position: new THREE.Vector3(x, 0, z),
        userData: mesh.userData,
      };

      this.room.tables.push(table);
      return table;
    } catch (error) {
      console.error("Error creating rectangular table:", error);
      return null;
    }
  }

  createRoundTableAtPosition(x, z, radius) {
    try {
      // Create geometry and material directly
      const height = 0.75;
      const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
      const material = new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        emissive: 0x000000,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, height / 2, z);
      mesh.updateMatrix();
      mesh.updateMatrixWorld(true);

      mesh.userData = {
        type: "roundTable",
        name: `Round Table ${this.objectCounter++}`,
        seats: [],
        radius: radius,
        height: height,
      };

      // Add to scene
      this.scene.add(mesh);

      // Create the object to return
      const table = {
        mesh: mesh,
        position: new THREE.Vector3(x, 0, z),
        userData: mesh.userData,
      };

      this.room.tables.push(table);
      return table;
    } catch (error) {
      console.error("Error creating round table:", error);
      return null;
    }
  }

  createSeatAtPosition(x, z) {
    try {
      // Create geometry and material directly
      const height = 0.5;
      const radius = 0.25;
      const geometry = new THREE.CylinderGeometry(radius, radius, height, 16);
      const material = new THREE.MeshStandardMaterial({
        color: 0x333333,
        emissive: 0x000000,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, height / 2, z);
      mesh.updateMatrix();
      mesh.updateMatrixWorld(true);

      mesh.userData = {
        type: "seat",
        name: `Seat ${this.objectCounter++}`,
        personName: "",
        height: height,
      };

      // Generate a unique ID for the seat
      const seatId = Date.now();
      mesh.userData.id = seatId;

      // Add to scene
      this.scene.add(mesh);

      // Create the object to return
      const seat = {
        mesh: mesh,
        position: new THREE.Vector3(x, 0, z),
        userData: mesh.userData,
        id: seatId,
      };

      this.room.seats.push(seat);
      return seat;
    } catch (error) {
      console.error("Error creating seat:", error);
      return null;
    }
  }

  // Toggle dashboard method
  toggleDashboard() {
    console.log("Toggle button clicked!");

    const dashboard = document.getElementById("dashboard");
    if (!dashboard) return;

    // Check the current state
    const isVisible = window.getComputedStyle(dashboard).display !== "none";
    console.log("Dashboard currently visible:", isVisible);

    // Use brute force approach to show/hide dashboard
    if (isVisible) {
      dashboard.style.display = "none";
    } else {
      // Brute force show dashboard
      dashboard.style.cssText =
        "position: fixed; top: 0; right: 0; width: 320px; height: 100%; background-color: white; box-shadow: -2px 0 10px rgba(0,0,0,0.1); z-index: 9999; display: block !important; visibility: visible !important; opacity: 1 !important;";
    }

    // Update button icon
    const toggleBtn = document.getElementById("toggle-dashboard");
    if (toggleBtn) toggleBtn.classList.toggle("rotate-180");

    console.log("Dashboard style after toggle:", dashboard.style.display);
  }

  // Show dashboard method (used by other components)
  showDashboard() {
    const dashboard = document.getElementById("dashboard");
    if (dashboard) {
      // Use the brute force approach for reliable display
      dashboard.style.cssText =
        "position: fixed; top: 0; right: 0; width: 320px; height: 100%; background-color: white; box-shadow: -2px 0 10px rgba(0,0,0,0.1); z-index: 9999; display: block !important; visibility: visible !important; opacity: 1 !important;";
      console.log("Dashboard shown via showDashboard method");
    }
  }

  // Modified createRoom method
  createRoom() {
    const width = parseFloat(document.getElementById("room-width").value);
    const length = parseFloat(document.getElementById("room-length").value);
    const height = parseFloat(document.getElementById("room-height").value);

    // Hide modal
    const modal = document.getElementById("room-setup-modal");
    if (modal) modal.style.display = "none";

    // Show dashboard using brute force method
    this.showDashboard();

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
    // Use safe event listener methods for all buttons
    this.safeAddEventListener("update-object-btn", "click", () =>
      this.updateSelectedObject()
    );
    this.safeAddEventListener("delete-object-btn", "click", () =>
      this.deleteSelectedObject()
    );
    this.safeAddEventListener("add-rect-seat-btn", "click", () =>
      this.addSeatToTable("rectangular")
    );
    this.safeAddEventListener("add-round-seat-btn", "click", () =>
      this.addSeatToTable("round")
    );

    // Close dashboard button handler
    this.safeAddEventListener("close-dashboard", "click", () => {
      const dashboard = document.getElementById("dashboard");
      if (dashboard) dashboard.style.display = "none";
    });

    // Handle color inputs safely
    this.safeAddColorInputHandler("rect-color", "rect-color-preview");
    this.safeAddColorInputHandler("round-color", "round-color-preview");
  }

  // Helper method for color input handlers
  safeAddColorInputHandler(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);

    if (input && preview) {
      input.addEventListener("input", (e) => {
        preview.style.backgroundColor = e.target.value;
      });
    }
  }

  initDragAndDrop() {
    console.log("Initializing drag and drop");
    const draggableItems = document.querySelectorAll(".draggable-item");
    console.log(`Found ${draggableItems.length} draggable items`);

    draggableItems.forEach((item) => {
      item.addEventListener("dragstart", (e) => {
        console.log(`Dragging started: ${item.dataset.objectType}`);
        e.dataTransfer.setData("objectType", item.dataset.objectType);
      });

      // Make items draggable
      item.setAttribute("draggable", "true");
      console.log(`Made item draggable: ${item.dataset.objectType}`);
    });

    // Handle drag over scene
    const sceneContainer = document.getElementById("scene-container");
    if (!sceneContainer) {
      console.error("Scene container not found!");
      return;
    }

    sceneContainer.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      sceneContainer.classList.add("drag-over");
    });

    sceneContainer.addEventListener("dragleave", () => {
      sceneContainer.classList.remove("drag-over");
    });

    // Handle drop on scene
    sceneContainer.addEventListener("drop", (e) => {
      e.preventDefault();
      sceneContainer.classList.remove("drag-over");

      const objectType = e.dataTransfer.getData("objectType");
      console.log(`Drop received for ${objectType}`);

      if (!objectType) {
        console.error("No object type in drop data");
        return;
      }

      // Calculate drop position in 3D space using raycasting
      const rect = sceneContainer.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.createObjectAtPosition(objectType, x, y);
    });

    // Initialize drag controls for 3D objects
    this.initDragControls();
  }

  safeAddEventListener(elementId, event, handler) {
    const element = document.getElementById(elementId);
    if (element) {
      element.addEventListener(event, handler);
      return true;
    }
    console.log(
      `Warning: Element with ID '${elementId}' not found, skipping event listener`
    );
    return false;
  }

  initObjectManipulation() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    if (!this.renderer || !this.renderer.domElement) return;

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

  createObjectAtPosition(objectType, screenX, screenY) {
    console.log(
      `Creating object of type ${objectType} at screen position (${screenX}, ${screenY})`
    );

    try {
      // Use raycasting to find the intersection with the floor plane
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2(screenX, screenY);
      raycaster.setFromCamera(mouse, this.camera);

      // Create a horizontal plane at y=0 for intersection
      const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersection = new THREE.Vector3();

      const didIntersect = raycaster.ray.intersectPlane(
        floorPlane,
        intersection
      );

      if (!didIntersect) {
        console.warn("Raycasting failed, using default position");
        // Use default position if raycasting fails
        intersection.set(0, 0, 0);
      }

      console.log(
        `World position: (${intersection.x}, ${intersection.y}, ${intersection.z})`
      );

      let object;

      // Create object based on type
      switch (objectType) {
        case "rectangularTable":
          object = this.createRectTableAtPosition(
            intersection.x,
            intersection.z,
            1.5,
            2
          );
          break;

        case "roundTable":
          object = this.createRoundTableAtPosition(
            intersection.x,
            intersection.z,
            1
          );
          break;

        case "seat":
          object = this.createSeatAtPosition(intersection.x, intersection.z);
          break;
      }

      // Add to scene and make draggable
      if (object && object.mesh) {
        // Make sure object mesh is valid before adding to draggable objects
        if (object.mesh.type && object.mesh.matrixWorld !== undefined) {
          this.draggableObjects.push(object.mesh);
          this.updateDragControls();
          this.updateObjectList();
          this.selectObject(object);
          console.log(`Successfully created ${objectType}`);

          // Show dashboard to see the new object
          this.showDashboard();
        } else {
          console.error(
            `Created ${objectType} but mesh is invalid for drag controls`
          );
        }
      } else {
        console.error(`Failed to create ${objectType} object`);
      }
    } catch (error) {
      console.error("Error in createObjectAtPosition:", error);
    }
  }

  initDragControls() {
    if (!this.camera || !this.renderer || !this.renderer.domElement) return;
    try {
      console.log("Initializing drag controls");
      this.cleanupDraggableObjects();
      if (this.draggableObjects.length === 0) {
        console.warn("No objects to drag");
        return;
      }
      this.dragControls = new DragControls(
        this.draggableObjects,
        this.camera,
        this.renderer.domElement
      );
      this.setupDragControlHandlers();

      // If useSafeDragControls flag is set, patch the events
      if (this.useSafeDragControls) {
        this.patchDragControlsEvents();
      }

      console.log("Drag controls initialized successfully");
    } catch (error) {
      console.error("Error initializing drag controls:", error);
    }
  }

  updateDragControls() {
    try {
      // Clean up invalid objects first
      this.cleanupDraggableObjects();

      if (this.dragControls) {
        this.dragControls.dispose();

        // Create new drag controls
        this.dragControls = new DragControls(
          this.draggableObjects,
          this.camera,
          this.renderer.domElement
        );

        // Set up event handlers
        this.setupDragControlHandlers();

        // If useSafeDragControls flag is set, patch the events
        if (this.useSafeDragControls) {
          this.patchDragControlsEvents();
        }
      }
    } catch (error) {
      console.error("Error updating drag controls:", error);
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
    if (!objectList) return;

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
    if (!objectList) return;

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
    const noSelectionMsg = document.getElementById("no-selection-message");
    const propertyEditor = document.getElementById("property-editor");
    const rectTableProps = document.getElementById("rectangular-table-props");
    const roundTableProps = document.getElementById("round-table-props");
    const seatProps = document.getElementById("seat-props");

    if (!noSelectionMsg || !propertyEditor) return;

    if (!object) {
      noSelectionMsg.classList.remove("hidden");
      propertyEditor.classList.add("hidden");
      return;
    }

    noSelectionMsg.classList.add("hidden");
    propertyEditor.classList.remove("hidden");

    // Hide all property groups
    if (rectTableProps) rectTableProps.classList.add("hidden");
    if (roundTableProps) roundTableProps.classList.add("hidden");
    if (seatProps) seatProps.classList.add("hidden");

    // Set common properties
    const nameInput = document.getElementById("object-name");
    if (nameInput) nameInput.value = object.userData?.name || "";

    // Show relevant property group
    if (object.userData?.type === "rectangularTable" && rectTableProps) {
      // Show rectangular table properties
      rectTableProps.classList.remove("hidden");

      // Set values
      const widthInput = document.getElementById("rect-width");
      const lengthInput = document.getElementById("rect-length");
      const heightInput = document.getElementById("rect-height");
      const colorInput = document.getElementById("rect-color");
      const colorPreview = document.getElementById("rect-color-preview");

      if (widthInput) widthInput.value = object.userData?.width || 1.5;
      if (lengthInput) lengthInput.value = object.userData?.length || 2;
      if (heightInput) heightInput.value = object.userData?.height || 0.75;

      const color = object.mesh?.material.color;
      if (color && colorInput && colorPreview) {
        const hexColor = "#" + color.getHexString();
        colorInput.value = hexColor;
        colorPreview.style.backgroundColor = hexColor;
      }

      // Update seats list
      this.updateSeatsList("rectangular", object);
    } else if (object.userData?.type === "roundTable" && roundTableProps) {
      // Show round table properties
      roundTableProps.classList.remove("hidden");

      // Set values
      const radiusInput = document.getElementById("round-radius");
      const heightInput = document.getElementById("round-height");
      const colorInput = document.getElementById("round-color");
      const colorPreview = document.getElementById("round-color-preview");

      if (radiusInput) radiusInput.value = object.userData?.radius || 1;
      if (heightInput) heightInput.value = object.userData?.height || 0.75;

      const color = object.mesh?.material.color;
      if (color && colorInput && colorPreview) {
        const hexColor = "#" + color.getHexString();
        colorInput.value = hexColor;
        colorPreview.style.backgroundColor = hexColor;
      }

      // Update seats list
      this.updateSeatsList("round", object);
    } else if (object.userData?.type === "seat" && seatProps) {
      // Show seat properties
      seatProps.classList.remove("hidden");

      // Set values
      const personNameInput = document.getElementById("person-name");
      if (personNameInput)
        personNameInput.value = object.userData?.personName || "";
    }
  }

  updateSeatsList(tableType, tableObject) {
    const containerId =
      tableType === "rectangular"
        ? "rect-seats-container"
        : "round-seats-container";
    const container = document.getElementById(containerId);
    if (!container) return;

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

    const seat = this.createSeatAtPosition(
      tablePosition.x + offsetX,
      tablePosition.z
    );
    if (!seat) return;

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

  cleanupDraggableObjects() {
    console.log(`Before cleanup: ${this.draggableObjects.length} objects`);

    // Filter out null and undefined objects
    this.draggableObjects = this.draggableObjects.filter((obj) => {
      // Check if the object is valid
      const isValid =
        obj &&
        obj.type &&
        typeof obj.matrixWorld !== "undefined" &&
        obj.userData;

      if (!isValid) {
        console.log("Removing invalid object from draggable objects array");
      }

      return isValid;
    });

    console.log(`After cleanup: ${this.draggableObjects.length} objects`);
  }

  setupDragControlHandlers() {
    if (!this.dragControls) return;

    // Constrain to XZ plane
    this.dragControls.addEventListener("drag", (event) => {
      try {
        const object = event.object;
        if (!object) return;

        object.position.y = object.userData?.height / 2 || 0.5; // Keep at original height

        // Constrain to room bounds
        const halfWidth = this.room.width / 2;
        const halfLength = this.room.length / 2;

        let objWidth = 0,
          objLength = 0;

        if (object.userData?.type === "rectangularTable") {
          objWidth = object.userData.width / 2 || 0.75;
          objLength = object.userData.length / 2 || 1;
        } else if (object.userData?.type === "roundTable") {
          objWidth = objLength = object.userData.radius || 0.5;
        } else if (object.userData?.type === "seat") {
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
      } catch (error) {
        console.error("Error in drag event handler:", error);
      }
    });

    // Add these safety handlers
    this.dragControls.addEventListener("dragstart", () => {
      // Disable camera controls when dragging objects
      if (window.orbitControls) {
        window.orbitControls.enabled = false;
      }
    });

    this.dragControls.addEventListener("dragend", () => {
      // Re-enable camera controls after dragging
      if (window.orbitControls) {
        window.orbitControls.enabled = true;
      }
    });
  }

  fixDragControlsMatrixWorldError() {
    console.log("Applying DragControls fix");

    try {
      // Clean up any invalid objects in the draggable objects array
      this.cleanupDraggableObjects();

      // If we already have drag controls, patch their event handlers
      if (this.dragControls) {
        this.patchDragControlsEvents();
      }

      // Make sure future drag controls are also patched
      this.useSafeDragControls = true;
    } catch (e) {
      console.error("Error fixing drag controls:", e);
    }
  }

  patchDragControlsEvents() {
    if (!this.dragControls) return;

    // Store original event handlers
    const originalHandlers = this.dragControls._listeners || {};

    // Replace with safe versions
    const safeHandler = (eventName, originalHandler) => {
      return function (event) {
        try {
          return originalHandler.call(this, event);
        } catch (error) {
          console.warn(`Prevented error in ${eventName}:`, error.message);
          return false;
        }
      };
    };

    // Remove all existing listeners
    this.dragControls.removeEventListener("drag");
    this.dragControls.removeEventListener("dragstart");
    this.dragControls.removeEventListener("dragend");
    this.dragControls.removeEventListener("hoveron");
    this.dragControls.removeEventListener("hoveroff");

    // Re-add with safe wrappers
    if (originalHandlers.drag) {
      for (const handler of originalHandlers.drag) {
        this.dragControls.addEventListener(
          "drag",
          safeHandler("drag", handler)
        );
      }
    }

    if (originalHandlers.dragstart) {
      for (const handler of originalHandlers.dragstart) {
        this.dragControls.addEventListener(
          "dragstart",
          safeHandler("dragstart", handler)
        );
      }
    }

    if (originalHandlers.dragend) {
      for (const handler of originalHandlers.dragend) {
        this.dragControls.addEventListener(
          "dragend",
          safeHandler("dragend", handler)
        );
      }
    }

    console.log("DragControls events patched with error handlers");
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
    const nameInput = document.getElementById("object-name");
    if (nameInput) this.selectedObject.userData.name = nameInput.value;

    if (type === "rectangularTable") {
      // Update rectangular table properties
      const widthInput = document.getElementById("rect-width");
      const lengthInput = document.getElementById("rect-length");
      const heightInput = document.getElementById("rect-height");
      const colorInput = document.getElementById("rect-color");

      if (!widthInput || !lengthInput || !heightInput || !colorInput) return;

      const width = parseFloat(widthInput.value);
      const length = parseFloat(lengthInput.value);
      const height = parseFloat(heightInput.value);
      const color = colorInput.value;

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
      const radiusInput = document.getElementById("round-radius");
      const heightInput = document.getElementById("round-height");
      const colorInput = document.getElementById("round-color");

      if (!radiusInput || !heightInput || !colorInput) return;

      const radius = parseFloat(radiusInput.value);
      const height = parseFloat(heightInput.value);
      const color = colorInput.value;

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
      const personNameInput = document.getElementById("person-name");
      if (!personNameInput) return;

      const personName = personNameInput.value;
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
