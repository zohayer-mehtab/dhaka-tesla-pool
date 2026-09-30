# Dhaka Tesla Pool (Hitch)

> Share a seat. Split the fare. Survive Dhaka traffic.

Ride-pooling MVP for Dhaka. Passengers request rides between city zones; a driver's three-seat battery three-wheeler ("Tesla") can carry several strangers at once; every passenger gets an individual fare, status and history. Seat capacity is enforced in the database, not in application memory.

| | |
|---|---|
<<<<<<< Updated upstream
| **Demo video (≤6 min)** | `<LOOM_URL>` |
| **Live deployment** | `<DEPLOY_URL>` *(or see [Deployment](#deployment) for the documented constraint + reproducible Docker path)* |
=======
| **Demo video (≤6 min)** | `https://www.loom.com/share/e1f39353124341a58bcc55f72c4d2b2d` |
| **Live deployment** | *(see [Deployment](#deployment) for the documented constraint + reproducible Docker path)* |
>>>>>>> Stashed changes
| **Release shown in video** | `release/v1.0.0` |

---

## Table of Contents
1. [Problem Statement](#1-problem-statement)
2. [Features Implemented](#2-features-implemented)
3. [Screenshots](#3-screenshots)
4. [Architecture](#4-architecture)
5. [ERD](#5-erd)
6. [Ride / Pool Lifecycle](#6-ride--pool-lifecycle)
7. [Domain Rules & Assumptions](#7-domain-rules--assumptions)
8. [Fare Model](#8-fare-model)
9. [Concurrency Strategy](#9-concurrency-strategy)
10. [Tech Stack & Justification](#10-tech-stack--justification)
11. [Project Structure](#11-project-structure)
12. [Prerequisites](#12-prerequisites)
13. [Environment Variables](#13-environment-variables)
14. [Setup & Execution](#14-setup--execution)
15. [Demo Credentials](#15-demo-credentials)
16. [API Overview](#16-api-overview)
17. [Testing](#17-testing)
18. [Git Workflow](#18-git-workflow)
19. [Deployment](#19-deployment)
20. [Key Decisions & Trade-offs](#20-key-decisions--trade-offs)
21. [Known Limitations](#21-known-limitations)
22. [Next Improvements](#22-next-improvements)
<<<<<<< Updated upstream
23. [Bonus: If Oi Tesla Goes Viral](#23-bonus-if-oi-tesla-goes-viral)
24. [AI Usage](#24-ai-usage)
=======
23. [AI Usage](#23-ai-usage)
>>>>>>> Stashed changes

---

## 1. Problem Statement

**8:41 AM, Banani Road 11.** **Jashim** leans against **Bullet**, his 3-seat battery three-wheeler. **Nusrat**, already late, requests a ride to **Mohakhali**. Two minutes later, stranger **Rafiq** requests almost the same route to **Gulshan 1**. The system must decide in ~1 second whether they can share Bullet, split the fare fairly, and stay within capacity. Thirty seconds later **Shirin** tries to grab the last seat.

| Actor | Needs |
|---|---|
| **Passenger** (Nusrat, Rafiq, Shirin) | Request ride (pickup, destination, seats), see estimated fare, track own status, cancel while valid, view history. Must **never** see another passenger's fare/status. |
| **Driver** (Jashim, Bullet) | Go online/offline, see compatible requests, accept, mark arrived/started/completed, see pool membership and seat usage. |
| **System** | Enforce `occupied seats ≤ capacity` under concurrency, enforce legal state transitions, compute per-passenger fares, retain an auditable history. |

Real routing is out of scope; geography is a fixed zone graph (§7).

---

## 2. Features Implemented

- **Auth**: passenger/driver sign-up and sign-in, bcrypt-hashed passwords, JWT (Passport), role guards (`PASSENGER`, `DRIVER`).
- **Ride requests**: pickup zone, destination zone, seat count (1–3); estimated fare returned on request.
- **Zone-based matching simulation**: same-pickup-zone + compatible-corridor rule with seat-fit check (§7).
- **Driver availability**: online/offline toggle; only online drivers with a vehicle receive/accept requests.
- **Pool management**: pool = one active trip of one Tesla; multiple ride requests are members; live seat occupancy.
- **Lifecycle**: `REQUESTED → MATCHED → DRIVER_ARRIVED → STARTED → COMPLETED`, plus `CANCELLED`; illegal transitions rejected with `409`.
- **Individual fares** with pool discount; integer **poysha** storage.
- **Wallet settlement**: cash or simulated **TeslaPay** wallet; atomic debit/credit on completion.
- **Audit trail**: every transition persisted in `ride_status_history` with actor and timestamp.
- **Ownership isolation**: a user can only read/modify their own rides; driver only their own pools.
- **Dockerised**: `docker compose up --build -d` → Postgres 16 + API + Web, migrations and seeds included.

---

## 3. Screenshots

<<<<<<< Updated upstream
| Passenger request | Driver pool view | Pooled fare / status |
|---|---|---|
| `docs/img/passenger-request.png` | `docs/img/driver-pool.png` | `docs/img/fare-status.png` |

*(Replace with real captures / GIFs before submission.)*
=======
| Passenger request | Driver pool view | Pooled fare / status | Request details |
|---|---|---|---|
| ![Passenger Dashboard](docs/img/passenger-dashboard.png) | ![Driver Pool](docs/img/driver-pool.png) | ![Passenger Ride History](docs/img/passenger-ride-request-history.png) | ![Passenger Request](docs/img/passenger-request.png) |
>>>>>>> Stashed changes

---

## 4. Architecture

```mermaid
flowchart LR
    subgraph Client
        B[Browser]
    end
    subgraph Web["web/ — Next.js 14 (App Router, Tailwind)"]
        N[Pages / Components<br/>lib/api.ts fetch client]
    end
    subgraph API["api/ — NestJS 11"]
        G[JwtAuthGuard + RolesGuard<br/>ValidationPipe]
        AU[auth]
        US[users]
        VE[vehicles]
        RR[ride-requests]
        PO[pools]
        CM[common<br/>zones · fare · state machine · filters]
    end
    DB[(PostgreSQL 16<br/>CHECK / FK / partial unique idx)]

    B -->|HTTPS| N
    N -->|REST + Bearer JWT| G
    G --> AU & US & VE & RR & PO
    RR & PO --> CM
    AU & US & VE & RR & PO -->|TypeORM 0.3 · transactions| DB
```

**Request path for a seat claim:** Browser → Next.js → `POST /ride-requests` → `RideRequestsService` opens a transaction → atomic conditional `UPDATE pools …` (§9) → insert history row → commit → JSON to client.

**Why no Redis/queues/microservices:** single Postgres instance comfortably handles MVP load and gives us the transactional guarantees pooling requires. Complexity is deferred to §23 where there is a stated reason.

---

## 5. ERD

```mermaid
erDiagram
    USERS ||--o| VEHICLES : "drives (driver_id UNIQUE)"
    VEHICLES ||--o{ POOLS : "runs"
    POOLS ||--o{ RIDE_REQUESTS : "has members"
    USERS ||--o{ RIDE_REQUESTS : "requests"
    RIDE_REQUESTS ||--o| PAYMENTS : "settled by"
    RIDE_REQUESTS ||--o{ RIDE_STATUS_HISTORY : "audited by"
    POOLS ||--o{ RIDE_STATUS_HISTORY : "audited by"
    USERS ||--o{ RIDE_STATUS_HISTORY : "acts in"

    USERS {
        uuid id PK
        varchar name
        varchar email UK
        varchar phone
        varchar password_hash
        enum role "PASSENGER|DRIVER"
        bigint wallet_balance_poysha "CHECK >= 0"
        boolean is_online "drivers only"
        timestamptz created_at
    }
    VEHICLES {
        uuid id PK
        uuid driver_id FK,UK
        varchar name "Bullet"
        varchar plate UK
        smallint capacity "CHECK 1..6"
    }
    POOLS {
        uuid id PK
        uuid vehicle_id FK
        enum status "OPEN|DRIVER_ARRIVED|STARTED|COMPLETED|CANCELLED"
        smallint seats_total "snapshot of vehicle.capacity"
        smallint seats_occupied "CHECK 0..seats_total"
        varchar origin_zone
        timestamptz started_at
        timestamptz completed_at
        timestamptz created_at
    }
    RIDE_REQUESTS {
        uuid id PK
        uuid passenger_id FK
        uuid pool_id FK "NULL until matched"
        varchar pickup_zone
        varchar destination_zone
        smallint seats "CHECK 1..6"
        enum status "REQUESTED|MATCHED|DRIVER_ARRIVED|STARTED|COMPLETED|CANCELLED"
        bigint base_fare_poysha
        bigint distance_charge_poysha
        bigint pool_discount_poysha
        bigint fare_poysha "final/estimated total"
        enum payment_method "CASH|TESLAPAY"
        timestamptz created_at
        timestamptz updated_at
    }
    PAYMENTS {
        uuid id PK
        uuid ride_request_id FK,UK
        uuid passenger_id FK
        enum method "CASH|TESLAPAY"
        enum status "PENDING|PAID|FAILED"
        bigint amount_poysha "CHECK >= 0"
        timestamptz created_at
    }
    RIDE_STATUS_HISTORY {
        bigint id PK
        uuid ride_request_id FK
        uuid pool_id FK
        varchar from_status
        varchar to_status
        uuid actor_user_id FK
        timestamptz created_at
    }
```

### Table rationale

| Table | Why it exists | Key constraints / indexes |
|---|---|---|
| `users` | Single identity table, role discriminator; wallet lives here for TeslaPay. | `UNIQUE(email)`, `CHECK(wallet_balance_poysha >= 0)` |
| `vehicles` | Capacity belongs to the vehicle, not the driver. | `UNIQUE(driver_id)` (1 Tesla/driver in MVP), `UNIQUE(plate)`, `CHECK(capacity > 0)` |
| `pools` | One row per physical trip; the **lock/CAS target** for capacity. | `CHECK(seats_occupied BETWEEN 0 AND seats_total)`; **partial unique index** `UNIQUE(vehicle_id) WHERE status IN ('OPEN','DRIVER_ARRIVED','STARTED')` → a Tesla has ≤1 live pool |
| `ride_requests` | One row per passenger booking; pool membership is `pool_id` (a request belongs to at most one pool, so no junction table is needed — 3NF holds). | Indexes: `(passenger_id, created_at DESC)`, `(pool_id)`, `(status, pickup_zone)` for driver discovery |
| `payments` | Separates money movement from ride state. | `UNIQUE(ride_request_id)` → idempotent settlement |
| `ride_status_history` | Append-only audit: *who moved which ride from what to what, when*. | Index `(ride_request_id, created_at)` |

**3NF note:** `seats_total` on `pools` and the fare-breakdown columns on `ride_requests` are intentional, documented snapshots (vehicle capacity or pricing rules may change after the trip; history must stay explainable). All other attributes depend only on their table's key.

---

## 6. Ride / Pool Lifecycle

```mermaid
stateDiagram-v2
    [*] --> REQUESTED
    REQUESTED --> MATCHED: driver accepts / auto-join open pool (seat CAS succeeds)
    REQUESTED --> CANCELLED: passenger cancels
    MATCHED --> CANCELLED: passenger cancels (seats released)
    MATCHED --> DRIVER_ARRIVED: driver marks arrival
    DRIVER_ARRIVED --> STARTED: driver starts trip (fares finalised)
    STARTED --> COMPLETED: driver completes (wallet settlement)
    COMPLETED --> [*]
    CANCELLED --> [*]
```

| From | Allowed next | Actor |
|---|---|---|
| `REQUESTED` | `MATCHED`, `CANCELLED` | Driver / system, Passenger |
| `MATCHED` | `DRIVER_ARRIVED`, `CANCELLED` | Driver, Passenger |
| `DRIVER_ARRIVED` | `STARTED` | Driver |
| `STARTED` | `COMPLETED` | Driver |
| `COMPLETED`, `CANCELLED` | — (terminal) | — |

- Transitions are defined in one map in `api/src/common/state-machine.ts`; every service goes through it. Invalid → `409 Conflict`.
- **Deviation from suggested lifecycle:** passenger cancellation after `DRIVER_ARRIVED` is disallowed (driver has already committed the seat/time). Rationale: prevents last-second seat-blocking abuse.
- Pool status mirrors the driver-driven stages; each member's `ride_requests.status` moves with it (except individual `CANCELLED`).

---

## 7. Domain Rules & Assumptions

| # | Assumption | Why |
|---|---|---|
| A1 | Geography = fixed zone table in `api/src/common/zones.ts` (Banani, Gulshan 1, Gulshan 2, Mohakhali, Farmgate, Dhanmondi, Mirpur, Uttara, Bashundhara). Pairwise distances in **metres** are hard-coded. | Evaluating engineering, not routing. Deterministic, hand-testable. |
| A2 | **Matching rule:** request *R* may join pool *P* iff (1) `P.status = OPEN`, (2) `R.pickup_zone == P.origin_zone`, (3) `R.destination_zone` is in the same **corridor** as the pool's existing destinations (e.g. Mohakhali and Gulshan 1 are both in the *north-east corridor* reachable from Banani), (4) `seats_occupied + R.seats ≤ seats_total`. | Nusrat (→Mohakhali) and Rafiq (→Gulshan 1) share a corridor, so they pool. |
| A3 | One Tesla per driver, one live pool per Tesla (DB-enforced). | Simplifies ownership; partial unique index guarantees it. |
| A4 | Seats per request: 1–3 (≤ capacity). | A request larger than remaining capacity stays `REQUESTED` (waits) rather than erroring. |
| A5 | Request that finds no seat is **not rejected**; it stays `REQUESTED` and is visible to other drivers. | Matches "waiting → matched" lifecycle. |
| A6 | Estimate shown at request time; **final fare locked at `STARTED`** based on actual pool membership at that moment. | Passengers who cancel before start don't retroactively distort others' fares mid-trip. |
| A7 | Driver receives 100 % of fare (no commission). | Out of scope. |
| A8 | Payment method chosen per request; TeslaPay wallet must cover the fare at **completion** (balance re-checked in settlement transaction). | Simulated wallet, no gateway. |

---

## 8. Fare Model

```
distanceCharge  = floor(distance_m × PER_KM_POYSHA / 1000)
poolDiscount    = isPooled ? floor(distanceCharge × POOL_DISCOUNT_BP / 10000) : 0
passengerFare   = BASE_FARE_POYSHA + distanceCharge − poolDiscount
```

| Constant | Value | Meaning |
|---|---|---|
| `BASE_FARE_POYSHA` | `4000` | ৳40.00 |
| `PER_KM_POYSHA` | `1200` | ৳12.00 / km |
| `POOL_DISCOUNT_BP` | `2000` | 20 % (basis points) of distance charge, when pool has ≥ 2 distinct passengers |

**Hand-check (Banani Road 11 story)** — distances: Banani→Mohakhali = 2 500 m, Banani→Gulshan 1 = 3 000 m:

| Passenger | Distance charge | Discount (20 %) | Base | **Fare** |
|---|---|---|---|---|
| Nusrat (solo estimate) | `2500×1200/1000 = 3000` | 0 | 4000 | **7000** (৳70.00) |
| Nusrat (pooled with Rafiq) | 3000 | `3000×2000/10000 = 600` | 4000 | **6400** (৳64.00) |
| Rafiq (pooled with Nusrat) | `3000×1200/1000 = 3600` | `3600×2000/10000 = 720` | 4000 | **6880** (৳68.80) |

Fares are **per-passenger, distance-based**, not a split of a shared total, so a short-hop passenger never subsidises a long-hop one. Multi-seat requests multiply the final fare by `seats`.

> ⚠️ Keep these numbers in sync with `api/src/common/fare.ts` and the unit test `fare.spec.ts`.

**Money storage: integer poysha (`BIGINT`).** IEEE-754 floats cannot represent `0.1` or `0.2` exactly (`0.1 + 0.2 = 0.30000000000000004`), so summing/splitting fares drifts. Integer minor units make arithmetic exact, comparisons `===`-safe, and `CHECK (amount >= 0)` meaningful. `BIGINT` (not `INT`) avoids the 2³¹ poysha (~৳21M) ceiling on aggregate wallet sums. TypeORM returns `BIGINT` as a string → a column transformer converts to `number` (safe below 2⁵³ poysha ≈ ৳90 trillion). `NUMERIC(12,2)` was considered; integers avoid decimal-string handling in JS entirely. Rounding is explicit (`floor`) and documented; all rounding remainders favour the passenger.

---

## 9. Concurrency Strategy

**Scenario:** Bullet has 1 seat free. Nusrat and Shirin both read "1 seat available" and both submit at the same instant. A naïve `read → check → write` lets both through (classic TOCTOU / lost-update), yielding 4/3 seats.

### Layer 1 — Atomic conditional update (Compare-And-Set), primary defence

```sql
UPDATE pools
   SET seats_occupied = seats_occupied + :seats
 WHERE id = :poolId
   AND status = 'OPEN'
   AND seats_occupied + :seats <= seats_total
RETURNING id, seats_occupied;
```

- Check and write are **one statement**; Postgres takes a row-level write lock, serialises concurrent updates on that row, and re-evaluates the `WHERE` against the freshly committed value (READ COMMITTED recheck).
- `rowCount = 0` ⇒ seat lost ⇒ request stays `REQUESTED`. Exactly one of Nusrat/Shirin gets `rowCount = 1`.
- Runs **inside the same transaction** as `UPDATE ride_requests SET pool_id, status='MATCHED'` and the history insert → no phantom seat if any step fails (rollback restores the count).

### Layer 2 — Database invariant (defence in depth)

`CHECK (seats_occupied BETWEEN 0 AND seats_total)` makes an over-booking bug in *any* code path fail loudly (`23514`) instead of corrupting data silently. `UNIQUE (vehicle_id) WHERE status IN (live)` prevents two live pools on one Tesla.

### Layer 3 — Pessimistic locking for multi-row transitions

State changes touching **pool + members** (start → finalise fares; complete → settle wallets; cancel → release seats) use:

```ts
const pool = await manager.getRepository(Pool).findOne({
  where: { id }, lock: { mode: 'pessimistic_write' },   // SELECT … FOR UPDATE
});
```

Members are then read and mutated while the pool row is held, so a concurrent cancel cannot slip between "compute fares" and "write fares". Wallet rows are locked in **ascending `id` order** to rule out deadlocks.

### Why this combination
| Option | Verdict |
|---|---|
<<<<<<< Updated upstream
| Application mutex / in-memory counter | ❌ breaks with >1 API replica |
| Optimistic `version` column + retry | ✔ valid, but needs retry loops; CAS `UPDATE` gives the same guarantee with no retry |
| `SERIALIZABLE` isolation | ✔ correct but aborts under contention and pushes retry logic to callers |
| Redis distributed lock | ❌ extra infra, adds a second source of truth; the DB already is the source of truth |
=======
| |
| Optimistic `version` column + retry | ✔ valid, but needs retry loops; CAS `UPDATE` gives the same guarantee with no retry |
| `SERIALIZABLE` isolation | ✔ correct but aborts under contention and pushes retry logic to callers |
|
>>>>>>> Stashed changes
| **CAS `UPDATE` + CHECK + `FOR UPDATE` on multi-row ops** | ✅ chosen |

### At larger scale
Shard pools by `vehicle_id`/geohash so contention is per-vehicle (already the case: the contended row is one pool). Move matching to a per-region queue/partition (single consumer per driver ⇒ no contention), idempotency keys on `POST /ride-requests` (`Idempotency-Key` header + unique index) to make client retries safe. See §23.

**Proof:** `api/test/pool-capacity.e2e-spec.ts` fires concurrent requests with `Promise.allSettled` against one remaining seat and asserts the invariant in the DB.

---

## 10. Tech Stack & Justification

| Layer | Choice | Alternatives considered | Why it fits ride-pooling MVP | Switch when… |
|---|---|---|---|---|
| Frontend | **Next.js 14+ (App Router), Tailwind CSS** | Vite + React Router, CRA | File-based routing for passenger/driver areas, layouts for auth shells, Tailwind keeps UI consistent without a design system. | Need heavy real-time map UI → add dedicated SPA/native app. |
| Backend | **NestJS 11 (Node.js)** | Express, Fastify, Hono | Module/DI structure maps 1:1 to domain (`pools`, `ride-requests`, …); built-in guards/pipes/filters give auth, validation and error handling uniformly; testable with `@nestjs/testing`. Express would need hand-rolled structure. | Team wants lower overhead/latency → Fastify adapter (drop-in for Nest). |
| API style | **REST + JSON** | GraphQL, tRPC | Resources map to lifecycle verbs (`POST /ride-requests/:id/start`); simple caching/rate limiting; no over-fetching problem at this size. | Many client shapes or live subscriptions → GraphQL/WebSocket gateway. |
| Database | **PostgreSQL 16** | MySQL, SQLite, MongoDB | Need ACID transactions, row locks, `CHECK` and partial unique indexes for capacity; relational data (users↔vehicles↔pools↔requests). PostGIS available for geo later. | Geospatial search at scale → PostGIS (same engine) or dedicated geo-store. |
| ORM | **TypeORM 0.3** | Prisma, Drizzle, Knex | First-class Nest integration, migrations CLI, `QueryRunner` + `pessimistic_write` locks + raw SQL for CAS update. | Prefer schema-first types/DX → Prisma/Drizzle. |
| Auth | **Passport-JWT + bcrypt**, `@nestjs/jwt` | Sessions, Auth0/Clerk, NextAuth | Stateless API, simple role claims, no paid provider. | Need SSO/refresh rotation/revocation → managed IdP or refresh-token store. |
| Validation | **class-validator / class-transformer** | Zod | Native `ValidationPipe`, DTO decorators, whitelist mode strips unknown fields. | — |
| Tests | **Jest + Supertest** | Vitest, Mocha | Nest default; supports real-DB e2e tests for concurrency. | — |
| Orchestration | **Docker Compose** | Bare scripts, k8s | Single-command reproducible environment; k8s would be unjustified. | Multi-node production → managed container platform/k8s. |
<<<<<<< Updated upstream
| Hosting | `<fill: e.g. Vercel (web) + Render/Fly free tier (api) + Neon/Supabase free Postgres>` | Paid VPS | Free tier required by brief. | Traffic/SLA needs outgrow free tier. |
=======
>>>>>>> Stashed changes

---

## 11. Project Structure

```text
dhaka-tesla-pool/
├── api/
│   ├── src/
│   │   ├── auth/            # register/login, JwtStrategy, JwtAuthGuard, RolesGuard
│   │   ├── common/          # zones.ts, fare.ts, state-machine.ts, filters, decorators, money transformer
│   │   ├── pools/           # Pool entity, seat CAS, driver pool endpoints, start/complete/settlement
│   │   ├── ride-requests/   # RideRequest entity, create/cancel/list, matching, history
│   │   ├── users/           # User entity, profile, online/offline, wallet
│   │   ├── vehicles/        # Vehicle entity (capacity), driver's Tesla
│   │   ├── app.module.ts
│   │   ├── data-source.ts   # TypeORM DataSource for CLI migrations/seed
│   │   └── main.ts          # bootstrap, global ValidationPipe, CORS, /health
│   ├── migrations/          # versioned schema + seed migrations
│   ├── test/                # e2e: pool-capacity.e2e-spec.ts, lifecycle, ownership
│   ├── Dockerfile
│   └── package.json
├── web/
│   ├── src/
│   │   ├── app/             # routes: /login, /passenger, /driver, /history
│   │   ├── components/      # RideForm, FareCard, StatusBadge, PoolSeats, States (Loading/Error/Empty)
│   │   ├── lib/             # api client, auth helpers
│   │   └── types/           # shared DTO/response types
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── .env.example
```

---

## 12. Prerequisites

| Tool | Version | Needed for |
|---|---|---|
| Docker + Docker Compose v2 | 24+ | Recommended path |
| Node.js | 20 LTS or 22 | Local (non-Docker) run |
| npm | 10+ | Local run |
| PostgreSQL | 16 | Local run without Docker |
| Git | 2.30+ | — |

---

## 13. Environment Variables

Copy `.env.example` → `.env`. **Never commit `.env`.** All values below are placeholders.

```dotenv
# ---------- PostgreSQL ----------
POSTGRES_USER=tesla
POSTGRES_PASSWORD=change_me_locally
POSTGRES_DB=tesla_pool
POSTGRES_PORT=5432

# ---------- API ----------
API_PORT=4000
NODE_ENV=development
DATABASE_URL=postgres://tesla:change_me_locally@db:5432/tesla_pool
JWT_SECRET=replace_with_long_random_string      # e.g. `openssl rand -hex 32`
JWT_EXPIRES_IN=1d
CORS_ORIGIN=http://localhost:3000
BCRYPT_ROUNDS=10

# ---------- Fare model (poysha / basis points) ----------
BASE_FARE_POYSHA=4000
PER_KM_POYSHA=1200
POOL_DISCOUNT_BP=2000

# ---------- Web ----------
WEB_PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:4000

# ---------- Tests (MUST be a dedicated DB; tests TRUNCATE) ----------
TEST_DATABASE_URL=postgres://tesla:change_me_locally@localhost:5432/tesla_pool_test
```

---

## 14. Setup & Execution

### A. Docker (recommended)

```bash
git clone https://github.com/zohayer-mehtab/dhaka-tesla-pool.git
cd dhaka-tesla-pool
cp .env.example .env            # edit secrets
docker compose up --build -d    # db + api + web
docker compose ps               # wait for db/api "healthy"
```

| Service | URL |
|---|---|
| Web | http://localhost:3000 |
| API | http://localhost:4000 |
| Health | http://localhost:4000/health |

**Migrations & seed** (run automatically on API start if `RUN_MIGRATIONS=true`; otherwise manually):

```bash
docker compose exec api npm run migration:run     # apply schema
docker compose exec api npm run seed              # Jashim/Bullet, Nusrat, Rafiq, Shirin
docker compose exec api npm run migration:revert  # roll back last migration
```

Reset everything: `docker compose down -v && docker compose up --build -d`.

Logs: `docker compose logs -f api`.

### B. Local (no Docker for app processes)

```bash
# 1. Postgres only
docker compose up -d db

# 2. API
cd api
npm ci
npm run migration:run
npm run seed
npm run start:dev          # http://localhost:4000

# 3. Web (new terminal)
cd web
npm ci
npm run dev                # http://localhost:3000
```

### C. Tests

```bash
docker compose exec db psql -U tesla -c "CREATE DATABASE tesla_pool_test;"   # once
cd api
npm run test               # unit: state machine, fare
npm run test:e2e           # integration: capacity, concurrency, ownership, lifecycle
```

---

## 15. Demo Credentials

Seeded by `npm run seed`. Demo-only passwords.

| Role | Name | Email | Password | Notes |
|---|---|---|---|---|
| Driver | **Jashim** | `jashim@dhakapool.test` | `Tesla@1234` | Vehicle **Bullet**, capacity **3**, plate `DHAKA-METRO-TH-11-0001` |
| Passenger | **Nusrat** | `nusrat@dhakapool.test` | `Tesla@1234` | Wallet ৳500.00 |
| Passenger | **Rafiq** | `rafiq@dhakapool.test` | `Tesla@1234` | Wallet ৳500.00 |
| Passenger | **Shirin** | `shirin@dhakapool.test` | `Tesla@1234` | Wallet ৳500.00 |

**Demo script (matches the brief's story):**
1. Jashim logs in → **Go online**.
2. Nusrat: Banani → Mohakhali, 1 seat → estimate ৳70.00 (solo), shows "up to 20 % off if pooled".
3. Rafiq: Banani → Gulshan 1, 1 seat → matches same corridor.
4. Jashim accepts → pool `2/3` seats; Nusrat & Rafiq see **only their own** fare/status.
5. Shirin requests 2 seats → doesn't fit (2+2 > 3) → stays `REQUESTED`; requests 1 seat → `MATCHED`, pool `3/3`.
6. Jashim: Arrived → Start (fares locked: Nusrat ৳64.00, Rafiq ৳68.80) → Complete → wallets settled.

---

## 16. API Overview

Base URL `/`. JSON. Auth = `Authorization: Bearer <JWT>`. Errors: `{ statusCode, error, message, path, timestamp }`.

| Method | Path | Role | Purpose |
|---|---|---|---|
| POST | `/auth/register` | public | Sign up (`role`; drivers include `vehicle {name, plate, capacity}`) |
| POST | `/auth/login` | public | → `{ accessToken }` |
| GET | `/users/me` | any | Profile + wallet |
| PATCH | `/users/me/availability` | DRIVER | `{ isOnline }` |
| POST | `/users/me/wallet/topup` | PASSENGER | Simulated TeslaPay top-up |
| GET | `/vehicles/mine` | DRIVER | Own Tesla |
| POST | `/ride-requests` | PASSENGER | `{ pickupZone, destinationZone, seats, paymentMethod }` → estimate; auto-joins compatible open pool if a seat CAS succeeds |
| GET | `/ride-requests/mine` | PASSENGER | Own history only |
| GET | `/ride-requests/:id` | PASSENGER (owner) / DRIVER (of its pool) | Detail; `404` for non-owners |
| POST | `/ride-requests/:id/cancel` | PASSENGER (owner) | Cancel if `REQUESTED`/`MATCHED`; releases seats |
| GET | `/ride-requests/open` | DRIVER (online) | Compatible `REQUESTED` requests |
| POST | `/ride-requests/:id/accept` | DRIVER | Create/join driver's pool; seat CAS |
| GET | `/pools/current` | DRIVER | Live pool, members, `seatsOccupied/seatsTotal` (members see names, **not** each other's fares) |
| GET | `/pools/history` | DRIVER | Past pools |
| POST | `/pools/:id/arrive` | DRIVER (owner) | `MATCHED → DRIVER_ARRIVED` |
| POST | `/pools/:id/start` | DRIVER (owner) | → `STARTED`; fares finalised |
| POST | `/pools/:id/complete` | DRIVER (owner) | → `COMPLETED`; settlement |
| GET | `/ride-requests/:id/history` | owner | `ride_status_history` rows |
| GET | `/health` | public | Liveness + DB ping |

Status codes: `400` validation · `401` unauthenticated · `403` wrong role · `404` not found / not yours (avoids ID probing) · `409` illegal transition or capacity · `422` business rule (e.g. insufficient wallet).

---

## 17. Testing

| Risk | Test | Type |
|---|---|---|
| Bullet capacity never exceeded | `pool-capacity.e2e-spec.ts` — last seat race (Nusrat vs Shirin), 12-way stampede, mixed seat sizes; DB invariant `SUM(seats) ≤ seats_total` | Integration (real Postgres) |
| Invalid state transitions rejected | `state-machine.spec.ts`, lifecycle e2e (`COMPLETED → STARTED` = 409) | Unit + e2e |
| Pooled fares correct | `fare.spec.ts`: Nusrat 6400 / Rafiq 6880 / solo 7000 | Unit |
| No cross-user access | ownership e2e: Rafiq `GET/cancel` Nusrat's ride → 404 | e2e |
| Cancellation rules | cancel allowed in `REQUESTED`/`MATCHED`, rejected after `DRIVER_ARRIVED`; seats released | e2e |
| Wallet settlement atomic | insufficient TeslaPay balance → transaction rolled back, ride not `COMPLETED` | e2e |

Run: `cd api && npm run test && npm run test:e2e`.
> e2e suite **truncates tables** and refuses to run unless the DB name ends in `_test`.

---

## 18. Git Workflow

| Branch | Purpose |
|---|---|
| `master` | Integrated, working features |
| `pre-release` | Integration fixes, docs, deployment checks (cut after MVP features merged) |
| `release/v1.0.0` | Cut from `pre-release`; version shown in video/deployment |
| `feature/*` | One logical change each (e.g. `feature/passenger-auth`, `feature/tesla-pooling`, `feature/driver-flow`, `feature/wallet-settlement`) |

Flow: `feature/*` (incremental commits) → merge to `master` → `pre-release` → `release/v1.0.0`.
Commit format: `<type>(<scope>): <short description>` — `feat|fix|refactor|test|docs|chore|build`, e.g. `fix(pool): prevent overbooking available seats`.

---

## 19. Deployment

Note on Deployment: In accordance with the zero-cost free-tier constraint, live cloud hosting with persistent PostgreSQL and real-time backend containers is provided via a fully reproducible local Docker Compose deployment. Run docker compose up --build -d to launch the production-ready instance instantly on any machine.

---

## 20. Key Decisions & Trade-offs

| Decision | Trade-off accepted |
|---|---|
| Seat state lives in `pools.seats_occupied` (counter) + `ride_requests.seats` (source rows) | Two representations must agree → guarded by CAS in one transaction and verified by the e2e invariant query. Benefit: O(1) capacity check with a single contended row. |
| CAS `UPDATE` over optimistic-version/serializable | Less generic, but no retry loop and no aborted transactions. |
| Loser of a seat race **stays `REQUESTED`** instead of `409` | Friendlier, matches lifecycle; client must poll/refresh. |
| Fare locked at `STARTED` | Estimate may differ from final fare; shown clearly as "estimate". |
| Zone table in code, not DB | Simple, versioned, no admin UI; changing zones needs a deploy. |
| Polling instead of WebSockets | Zero extra infra; ~3 s staleness. |
| `404` (not `403`) for other users' rides | Avoids confirming resource existence. |
| Fare breakdown columns denormalised | Explainable history if pricing constants change. |
| JWT in `Authorization` header (stored in memory / httpOnly cookie via Next route) | No server sessions; no revocation list in MVP. |

---

## 21. Known Limitations

- Zones and distances are static; no real routing, ETAs or traffic/weather surcharges.
- No real-time push; UI polls.
- No JWT refresh/revocation; no rate limiting; no email/phone verification.
- One Tesla per driver; no driver-side partial drop-offs (whole pool starts/completes together).
- Wallet is simulated: no top-up gateway, no refunds/disputes flow, no driver payouts.
- Matching is first-come within a corridor, not optimal.
- Free-tier hosting may cold-start.

## 22. Next Improvements

1. Per-stop drop-off (`pool_stops`) so each passenger completes independently.
2. `Idempotency-Key` for `POST /ride-requests`.
3. WebSocket/SSE status push.
4. Rate limiting (`@nestjs/throttler`), refresh-token rotation, audit-log export.
5. PostGIS-based matching with real coordinates and detour-bounded pooling.
6. Ratings, driver commission, payout ledger (double-entry `ledger_entries`).
7. CI pipeline (lint, unit, e2e with Postgres service) on every PR.

---



## 23. AI Usage

> Disclosure: AI is used as an engineering tool; I own and can explain every line.

| Tool | Used for |
|---|---|
| **Claude (Anthropic)** | Drafting architectural README sections, structuring the Mermaid ERD/flowcharts, designing the Compare-and-Swap (CAS) SQL transaction template, and scaffolding the NestJS integration tests. |
| **GitHub Copilot** | Inline code completion and mapping TypeORM entity relation properties. |

**Accepted suggestion — atomic CAS for seat capacity.**
AI proposed claiming seats with a single conditional `UPDATE pools SET seats_taken = seats_taken + :n WHERE id = :id AND seats_taken + :n <= seats_capacity`, checking `rowCount`. I accepted it because the check-and-increment is one atomic statement under Postgres's row lock (no TOCTOU), needs no retry loop, and is backed by a `CHECK` constraint. I verified it with the `Promise.allSettled` race test.

**Rejected / modified suggestion — Redis distributed lock for seat claims.**
AI suggested a Redis `SETNX` lock around "read seats → insert ride → write seats". I rejected it: it adds infrastructure the brief discourages, introduces a second source of truth, and leaves a failure window (lock expiry mid-transaction) that the DB constraint would still have to catch. I kept the lock-free CAS and reserved `SELECT … FOR UPDATE` only for multi-row transitions (start/complete/cancel).

**Accepted suggestion — integer poysha for currency representation.**
AI recommended handling all fare math using integer `bigint` types representing minor currency units (poysha) rather than JavaScript floating-point numbers or SQL `DECIMAL` types. I accepted this to completely eliminate binary floating-point rounding errors and ensure 100% deterministic, hand-verifiable fare splits between Nusrat and Rafiq.

---

**Author:** Zohayer Mehtab · **Repo:** https://github.com/zohayer-mehtab/dhaka-tesla-pool