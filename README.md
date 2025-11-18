Smart Parking — Backend (Node.js + Express + MongoDB)

Changelog / Recent changes
- Added full detailed API reference, request/response samples, fee calculation, and concurrency notes. Expanded the README and replaced the Changelog section with your commit notes.

Overview
This repository implements a backend service for a smart parking lot system. It supports multi-floor lots, parking spot allocation, parking sessions (tickets), and fee calculation using configurable rate rules.

Tech stack
- Node.js
- Express
- MongoDB with Mongoose
- Entry points: index.js / server.js
- Source files under: src/

Quick start
1. Ensure MongoDB is running and .env contains DB_URL and DB_NAME (or provide a connection string).
2. Install dependencies and start the server:
   npm install
   npm start

Environment variables
- DB_URL — MongoDB connection string (e.g., mongodb://localhost:27017)
- DB_NAME — Database name
- PORT — optional, server port (defaults depend on server.js)
(If you added other env vars like REDIS_URL, include them here.)

High-level design
- ParkingLot contains ParkingFloor documents.
- ParkingFloor contains ParkingSpot documents; each spot has supportedTypes (motorcycle, small, medium, heavy), isOccupied flag, and optional metadata.
- ParkingSession documents track check-in (entryAt), check-out (exitAt), associated spot, and calculated fee.
- RateConfig per parking lot: defines unitMinutes and pricePerUnit per vehicle type, with optional graceMinutes and rounding modes.

API Reference — Detailed endpoints
Each endpoint below contains: method, path, request body example, success response example, and common error responses.

1) Create Parking Lot
- Method: POST
- Path: /parkinglots
- Purpose: Create a new ParkingLot.
- Request body (application/json):
{
  "name": "Central Lot",
  "address": "123 Main St",
  "floors": 2
}
- Success (201) example:
{
  "_id": "64f1c2e3aab1234567890abc",
  "name": "Central Lot",
  "address": "123 Main St",
  "floors": 2,
  "createdAt": "2025-11-18T12:00:00.000Z"
}
- Errors:
  - 400 Bad Request: { "error": "Name, address, and floors are required." }
  - 409 Conflict (duplicate name): { "error": "Parking lot with this name already exists." }

2) Create Parking Floor
- Method: POST
- Path: /parkingfloors
- Purpose: Add a floor to an existing ParkingLot.
- Request body:
{
  "parkingLotId": "64f1c2e3aab1234567890abc",
  "floorNumber": 1,
  "name": "Ground Floor",
  "capacities": { "small": 50, "medium": 20, "motorcycle": 10 }
}
- Success (201) example:
{
  "_id": "64f1c2e3aab1234567890def",
  "parkingLotId": "64f1c2e3aab1234567890abc",
  "floorNumber": 1,
  "name": "Ground Floor",
  "capacities": { "small": 50, "medium": 20 }
}
- Errors:
  - 400: { "error": "parkingLotId and floorNumber are required." }
  - 404: { "error": "Parking lot not found." }

3) Create Parking Spot
- Method: POST
- Path: /parkingspots
- Purpose: Add a parking spot to a floor.
- Request body:
{
  "parkingLotId": "64f1c2e3aab1234567890abc",
  "floorId": "64f1c2e3aab1234567890def",
  "spotNumber": "G1-001",
  "supportedTypes": ["small", "motorcycle"],
  "metadata": { "nearElevator": true }
}
- Success (201) example:
{
  "_id": "6500f1e7aa11122233344455",
  "parkingLotId": "64f1c2e3aab1234567890abc",
  "floorId": "64f1c2e3aab1234567890def",
  "spotNumber": "G1-001",
  "supportedTypes": ["small","motorcycle"],
  "metadata": { "nearElevator": true },
  "isOccupied": false,
  "currentSessionId": null
}
- Errors:
  - 400: { "error": "Invalid vehicle type in supportedTypes: 'truck'." }
  - 404: { "error": "Floor or parking lot not found." }

4) Park a vehicle (Check-in / Create Parking Session)
- Method: POST
- Path: /vehicles
- Purpose: Allocate a matching ParkingSpot and create a ParkingSession.
- Request body (client usage):
{
  "licensePlate": "ABC-123",
  "vehicleType": "small",
  "ownerName": "Alice"
}
- Admin usage may include parkingLotId to force allocation in a specific lot.
- Allocation notes: server searches for an available spot whose supportedTypes includes vehicleType and reserves it atomically using a single findOneAndUpdate that sets isOccupied=true and currentSessionId.
- Success (201) example:
{
  "ticketId": "66a4b7c8d9e01234567890ab",
  "licensePlate": "ABC-123",
  "vehicleType": "small",
  "ownerName": "Alice",
  "spotId": "6500f1e7aa11122233344455",
  "spotNumber": "G1-001",
  "floorId": "64f1c2e3aab1234567890def",
  "parkingLotId": "64f1c2e3aab1234567890abc",
  "entryAt": "2025-11-18T13:00:00.000Z"
}
- Errors:
  - 400: { "error": "licensePlate and vehicleType are required." }
  - 404: { "error": "No available spot for this vehicle type." }

5) Get Parking Session / Ticket Details
- Method: GET
- Path: /vehicles/:ticketId
- Purpose: Retrieve ParkingSession with populated spot, floor, and lot details.
- Success (200) example:
{
  "_id": "66a4b7c8d9e01234567890ab",
  "ticketId": "66a4b7c8d9e01234567890ab",
  "licensePlate": "ABC-123",
  "vehicleType": "small",
  "ownerName": "Alice",
  "spot": {
    "_id": "6500f1e7aa11122233344455",
    "spotNumber": "G1-001",
    "floorId": "64f1c2e3aab1234567890def",
    "parkingLotId": "64f1c2e3aab1234567890abc"
  },
  "entryAt": "2025-11-18T13:00:00.000Z",
  "exitAt": null,
  "fee": null,
  "status": "active"
}
- Errors:
  - 404: { "error": "Parking session not found." }

6) Unpark Vehicle (Check-out / Complete Session & Calculate Fee)
- Method: PUT
- Path: /vehicles/:ticketId
- Purpose: Complete the ParkingSession, calculate fee using RateConfig, and release the spot.
- Request body: none
- Fee calculation rules (detailed below).
- Success (200) example:
{
  "ticketId": "66a4b7c8d9e01234567890ab",
  "licensePlate": "ABC-123",
  "entryAt": "2025-11-18T13:00:00.000Z",
  "exitAt": "2025-11-18T15:45:00.000Z",
  "minutesParked": 165,
  "fee": 30
}
- Errors:
  - 400: { "error": "Parking session already completed." }
  - 404: { "error": "Parking session not found." }
- Implementation notes: release the spot only if spot.currentSessionId === sessionId to avoid race conditions. Ensure atomic updates where needed.

7) Create RateConfig
- Method: POST
- Path: /rateconfigs
- Purpose: Define per-lot rate rules for fee calculation.
- Request body example:
{
  "parkingLotId": "64f1c2e3aab1234567890abc",
  "rates": {
    "motorcycle": { "unitMinutes": 60, "pricePerUnit": 5 },
    "small":      { "unitMinutes": 60, "pricePerUnit": 10 },
    "medium":     { "unitMinutes": 60, "pricePerUnit": 20 },
    "heavy":      { "unitMinutes": 60, "pricePerUnit": 30 }
  },
  "graceMinutes": 5,
  "rounding": "ceil"
}
- Success (201) example:
{
  "_id": "66b5c7d8e9f0a1b2c3d4e5f6",
  "parkingLotId": "64f1c2e3aab1234567890abc",
  "rates": { ... },
  "graceMinutes": 5,
  "rounding": "ceil"
}
- Errors:
  - 400: { "error": "parkingLotId is required and rates must include entries for vehicle types." }
  - 404: { "error": "Parking lot not found." }
  - 409: { "error": "Rate configuration for this parking lot already exists." }

8) Get RateConfig by Parking Lot
- Method: GET
- Path: /rateconfigs/:parkingLotId
- Success (200) example:
{
  "_id": "66b5c7d8e9f0a1b2c3d4e5f6",
  "parkingLotId": "64f1c2e3aab1234567890abc",
  "rates": { ... },
  "graceMinutes": 5,
  "rounding": "ceil"
}
- Errors:
  - 404: { "error": "RateConfig not found for parking lot." }

9) Update RateConfig
- Method: PUT
- Path: /rateconfigs/:id
- Purpose: Update RateConfig partially or fully.
- Request body example (partial update):
{
  "graceMinutes": 10,
  "rounding": "floor"
}
- Success (200) example:
{
  "_id": "66b5c7d8e9f0a1b2c3d4e5f6",
  "parkingLotId": "64f1c2e3aab1234567890abc",
  "rates": { ... },
  "graceMinutes": 10,
  "rounding": "floor"
}
- Errors:
  - 400/404 depending on validation or missing resource.

10) Delete RateConfig
- Method: DELETE
- Path: /rateconfigs/:id
- Success (200):
{ "success": true }
- Errors:
  - 404: { "error": "RateConfig not found." }

Fee calculation — detailed
- Lookup RateConfig for the parking lot and vehicleType. If none found, fallback defaults apply:
  - unitMinutes = 60
  - pricePerUnit = 10
  - graceMinutes = 0
  - rounding = ceil
- Steps:
  1. rawMinutes = floor((exitAt - entryAt) / 60000)
  2. minutesAfterGrace = max(0, rawMinutes - graceMinutes)
  3. Apply rounding behavior (repo supports: ceil, floor, minute):
     - ceil: units = ceil(minutesAfterGrace / unitMinutes)
     - floor: units = floor(minutesAfterGrace / unitMinutes) (if 0 -> units = 0)
     - minute: round minutesAfterGrace to nearest minute (implementation-specific — commonly used to round to nearest whole minute before computing units)
  4. fee = units * pricePerUnit
- Example:
  - entryAt = 13:00, exitAt = 15:45 -> rawMinutes = 165
  - grace = 5 -> minutesAfterGrace = 160
  - unit = 60, price = 10, rounding = ceil
  - units = ceil(160 / 60) = 3 -> fee = 30

Allocation & concurrency notes
- Allocation MUST be atomic: use findOneAndUpdate on ParkingSpot with filter { isOccupied: false, supportedTypes: vehicleType } and update { $set: { isOccupied: true, currentSessionId: sessionId }}. Return the updated spot in the same operation.
- When completing a session, clear spot.isOccupied and spot.currentSessionId only if currentSessionId === sessionId.

Testing suggestions
- Add integration tests using mongodb-memory-server to verify allocation correctness and concurrency safety.
- Add unit tests for fee calculation (edge cases: exact unit boundaries, grace minutes, rounding modes).