# Restaurant 3D Simulator

## Overview
The Restaurant 3D Simulator is a web-based application that allows users to create a 3D simulation of a restaurant room. Users can input measurements to generate a 3D map of the room, add rectangular and round tables, and place seats with people represented in the simulation.

## Features
- Create a 3D representation of a restaurant room based on user-defined measurements.
- Add rectangular tables by specifying height and width.
- Add round tables using circumference or radius.
- Place seats in the room and represent people sitting at those seats, with their names displayed above their heads.

## Project Structure
```
restaurant-3d-simulator
├── src
│   ├── index.js               # Entry point of the application
│   ├── styles
│   │   └── main.css           # CSS styles for the application
│   ├── components
│   │   ├── Room.js            # Class representing the restaurant room
│   │   ├── Table.js           # Base class for tables
│   │   │   ├── RectangularTable.js # Class for rectangular tables
│   │   │   └── RoundTable.js   # Class for round tables
│   │   ├── Seat.js            # Class representing a seat
│   │   └── Person.js          # Class representing a person
│   ├── utils
│   │   ├── MeasurementConverter.js # Utility functions for measurement conversion
│   │   └── SceneManager.js     # Class for managing the Three.js scene
│   └── models
│       └── data.js            # Data models or constants
├── public
│   ├── index.html             # Main HTML file
│   └── assets
│       └── textures           # Directory for texture files
├── package.json                # npm configuration file
└── README.md                   # Project documentation
```

## Installation
1. Clone the repository:
   ```
   git clone https://github.com/yourusername/restaurant-3d-simulator.git
   ```
2. Navigate to the project directory:
   ```
   cd restaurant-3d-simulator
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Usage
1. Start the application:
   ```
   npm start
   ```
2. Open your browser and navigate to `http://localhost:3000` to view the simulation.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.