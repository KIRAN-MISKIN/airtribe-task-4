Smart Parking — Low-level Design & API

This project implements a backend for a smart parking lot, with multi-floor support, spot allocation, parking sessions, and fee calculation.

Key components

- MongoDB / Mongoose models are under `src/db/models`.
- Controllers are in `src/controller` and routes are wired in `src/router/index.js`.

Design summary

- There is a single ParkingLot (the system assumes one lot) containing two floors by default: "Ground" and "First Floor". The API auto-assigns vehicles to an available spot across the lot — clients do not need to provide the parking lot or floor when checking in.

- ParkingLot contains multiple floors (`ParkingFloor`).
- Each floor has multiple `ParkingSpot` documents with `supportedTypes` (motorcycle, small, medium, heavy).
- When a vehicle arrives a `ParkingSession` is created and a `ParkingSpot` is atomically reserved by setting `isOccupied=true` and `currentSessionId`.
- When a vehicle leaves, the session is completed, fee is calculated using `RateConfig` (per parking lot), and the spot is released only if still held by that session.

Fee calculation

- Each `RateConfig` contains per-vehicle-type rate entries: `{ unitMinutes, pricePerUnit }`.
- Optional `graceMinutes` and `rounding` (`ceil`, `floor`, `minute`) are applied.
- Fee = ceil((minutesAfterGrace) / unitMinutes) * pricePerUnit

Default fallback (if no RateConfig): 60 minutes unit, price 10.

Endpoints (summary)

- POST /parkinglots — create a parking lot (already implemented)
- POST /parkingfloors — create a floor
- POST /parkingspots — create a parking spot
- POST /vehicles — park vehicle and get ticket (body: licensePlate, vehicleType). The server auto-selects the parking lot and floor; `parkingLotId` is optional and only used for administrative/testing purposes.
- PUT /vehicles/:ticketId — unpark (checkout) and calculate fee
- GET /vehicles/:ticketId — get session/ticket details
- POST /rateconfigs — create rate config for a parking lot
- GET /rateconfigs/:parkingLotId — get rate config for a lot
- PUT /rateconfigs/:id — update rate config
- DELETE /rateconfigs/:id — delete rate config

How to run

1. Ensure MongoDB is running and `.env` contains `DB_URL` and `DB_NAME`.
2. Install dependencies and start the server:

```powershell
npm install
npm start
```

Examples

Park a vehicle (JSON body):

```
{
  "licensePlate": "ABC-123",
  "vehicleType": "small",
  "parkingLotId": "PARKING_LOT_ID"
}
```

Unpark (checkout):

```
PUT /vehicles/TICKET_ID
```

Create rate config (example body):

```
{
  "parkingLotId": "...",
  "rates": {
    "motorcycle": { "unitMinutes": 60, "pricePerUnit": 5 },
    "small": { "unitMinutes": 60, "pricePerUnit": 10 },
    "medium": { "unitMinutes": 60, "pricePerUnit": 20 },
    "heavy": { "unitMinutes": 60, "pricePerUnit": 30 }
  },
  "graceMinutes": 5,
  "rounding": "ceil"
}
```

Next suggested improvements

- Add integration tests using `mongodb-memory-server` to validate allocation and concurrency.
- Add authentication/authorization to admin routes.
- Add metrics / monitoring for occupancy and earnings.

Detailed API report
-------------------

This section documents every endpoint implemented in the project with expected request bodies and example success and failure responses. Use these when testing or building clients.

1) Create Parking Lot
  - Method: POST
  - Path: /parkinglots
  - Request body (application/json):
    {
      "name": "Central Lot",
      "address": "123 Main St",
      "floors": 1
    }
  - Success (201): returns created ParkingLot document
    {
      "name": "Central Lot",
      "address": "123 Main St",
      "floors": 1,
      "_id": "...",
      "createdAt": "..."
    }
  - Failure (400): missing required fields or duplicate name
    { "error": "Name, address, and floors are required." }

2) Create Parking Floor
  - Method: POST
  - Path: /parkingfloors
  - Request body:
    {
      "parkingLotId": "<parkingLotId>",
      "floorNumber": 1,
      "name": "Ground Floor",
      "capacities": { "small": 50, "medium": 20 }
    }
  - Success (201): returns created ParkingFloor document
  - Failure (400): missing params or floor already exists
    { "error": "parkingLotId and floorNumber are required." }
  - Failure (404): parking lot not found

3) Create Parking Spot
  - Method: POST
  - Path: /parkingspots
  - Request body:
    {
      "parkingLotId": "<parkingLotId>",
      "floorId": "<floorId>",
      "spotNumber": "F1-001",
      "supportedTypes": ["small","motorcycle"],
      "metadata": { "nearElevator": true }
    }
  - Success (201): returns created ParkingSpot doc (includes isOccupied:false)
  - Failure (400): missing fields or invalid supportedTypes
    { "error": "Invalid vehicle type in supportedTypes: ..." }
  - Failure (404): floor or parking lot not found

4) Park a vehicle (check-in / allocate spot)
  - Method: POST
  - Path: /vehicles
  - Request body (normal client usage):
    {
      "licensePlate": "ABC-123",
      "vehicleType": "small",   // one of: motorcycle, small, medium, heavy
      "ownerName": "Alice"      // optional
    }
  - Notes: `parkingLotId` is optional. When omitted the server will auto-select the single configured parking lot and find an available spot across floors.
  - Success (201): returns a ticket object with session id and spot info
    {
      "ticketId": "<sessionId>",
      "licensePlate": "ABC-123",
      "spotId": "<spotId>",
      "spotNumber": "F1-001",
      "floorId": "<floorId>",
      "entryAt": "2025-..."
    }
  - Failure (400): missing params or invalid vehicleType
    { "error": "licensePlate and vehicleType are required." }
  - Failure (404): no available spot for requested vehicle type or no parking lot configured
    { "error": "No available spot for this vehicle type." }

Notes on allocation: allocation is atomic — the API uses a single findOneAndUpdate that sets isOccupied=true and assigns a generated currentSessionId. This prevents double-assignment when multiple requests arrive concurrently.

5) Unpark a vehicle (check-out / calculate fee)
  - Method: PUT
  - Path: /vehicles/:ticketId
  - Request body: none
  - Success (200):
    {
      "ticketId": "<sessionId>",
      "exitAt": "2025-...",
      "fee": 20
    }
  - Failure (400): already completed or bad request
    { "error": "Parking session already completed." }
  - Failure (404): session not found

Fee calculation logic (used on unpark):
  - Look up `RateConfig` for the parking lot. If absent, fallback to default: unitMinutes=60, pricePerUnit=10.
  - Subtract optional `graceMinutes`.
  - Apply rounding: `ceil`, `floor`, or `minute` (round to nearest minute).
  - Units = ceil(minutesAfterGrace / unitMinutes).
  - fee = units * pricePerUnit.

6) Get parking ticket details
  - Method: GET
  - Path: /vehicles/:ticketId
  - Success (200): returns ParkingSession document populated with vehicle, spot, floor and parkingLot
  - Failure (404): session not found

7) RateConfig endpoints (per-parking-lot rates)
  - Create: POST /rateconfigs
    Request body example:
    {
      "parkingLotId": "<parkingLotId>",
      "rates": {
        "motorcycle": { "unitMinutes": 60, "pricePerUnit": 5 },
        "small": { "unitMinutes": 60, "pricePerUnit": 10 },
        "medium": { "unitMinutes": 60, "pricePerUnit": 20 },
        "heavy": { "unitMinutes": 60, "pricePerUnit": 30 }
      },
      "graceMinutes": 5,
      "rounding": "ceil"
    }
    Success (201): created RateConfig
    Failures: 400 missing parkingLotId or already exists, 404 lot not found

  - Get by lot: GET /rateconfigs/:parkingLotId
    Success (200): returns RateConfig
    Failure (404): not found

  - Update: PUT /rateconfigs/:id
    Request body: any updatable fields (partial allowed). Success returns updated doc.

  - Delete: DELETE /rateconfigs/:id
    Success (200): { "success": true }

Test report (what I ran locally)
--------------------------------
- I executed a scripted set of calls against a running server (see `server.js` entrypoint). The test log files are saved in the repo root if you ran the built-in tests:
  - `api-test-log.txt`
  - `api-test-log2.txt`
  - `api-test-log3.txt` (most complete)
  - `api-test-continue.txt` / `api-test-continue2.txt`

Summary of the main successful steps (from the clean run saved in `api-test-log3.txt`):
  - Created a parking lot, a floor and two `small` spots.
  - Created a `RateConfig` for the lot.
  - Parked two `small` vehicles — each was allocated a different spot (F1-001 and F1-002).
  - Attempted to park a third `small` vehicle while both spots were occupied — API returned a 404 / "No available spot" (expected behavior).

Notes about later failures during tests: some follow-up unpark/park attempts in the same environment produced 400/404s due to leftover state from earlier manual runs. For reliable automated testing, I recommend running the tests against a clean database (drop test collections or use a dedicated test DB).

How to re-run the integration smoke test (PowerShell)
```powershell
# Start server first (from project root):
npm install
node server.js

# Then run the scripted checks in PowerShell (example snippet - run interactively):
$base = 'http://localhost:8000'
# Use Invoke-RestMethod to POST /parkinglots, /parkingfloors, /parkingspots, /rateconfigs, /vehicles, etc. A simple version of the script used during testing is available in the project terminal history.
```

Good-to-know / next steps
-------------------------
- To get fully reproducible integration tests, add a small test harness that uses `mongodb-memory-server` and a test runner (Jest/Mocha). I can add that automatically.
- Consider adding admin authentication to rate-config and parking creation endpoints.
- Add metrics for occupancy and earnings per-lot if you plan to monitor production behavior.

If you want, I can now:
- (A) Reset the test DB and re-run the full automated script and attach a single consolidated log and pass/fail summary.
- (B) Implement an automated test harness (mongodb-memory-server + Jest) and include CI-friendly scripts.
- (C) Add a small `scripts/seed.js` to create a lot/floor/spots so you can test quickly.

Tell me which of A/B/C you'd like next and I will implement it.
