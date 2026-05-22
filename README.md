# 🌐 PulseSphere AI — Crisis Intelligence Dashboard

> Real-time Brand Crisis Velocity Index (CVI) monitoring and threat intelligence platform.  
> Built for hackathon · Next.js 16 + FastAPI + Supabase Realtime

---

## ✨ What is PulseSphere AI?

PulseSphere AI is a full-stack SaaS dashboard that tracks a **Crisis Vulnerability Index (CVI)** — a rolling score from 0–100 that reflects the real-time threat level of a monitored brand. As CVI rises, the UI transitions through four threat states:

| Score | Level | Color |
|-------|-------|-------|
| 0 – 39 | 🟢 Low | Green |
| 40 – 59 | 🟡 Watch | Yellow |
| 60 – 74 | 🟠 Medium | Orange |
| 75 – 100 | 🔴 High | Red |

The frontend currently runs on a **simulated mock data feed** (a `setInterval` that fires every 3 seconds) and is wired up to connect to the FastAPI + Supabase Realtime backend once credentials are provided.

---

## 🗂 Project Structure

```
hack-clash/
├── backend/                  FastAPI REST API
│   ├── main.py               App entrypoint + all route handlers
│   ├── requirements.txt      Python dependencies
│   └── .env.example          Environment variable template
├── frontend/                 Next.js 16 (App Router) dashboard
│   ├── app/
│   │   ├── layout.tsx        Root layout — dark mode, metadata
│   │   ├── page.tsx          Main dashboard page + mock data engine
│   │   └── globals.css       Tailwind v4 + shadcn/ui CSS variables
│   └── components/
│       ├── Sidebar.tsx       Navigation shell (Home/Alerts/Playbooks/Settings)
│       ├── CviGauge.tsx      Custom SVG half-circle gauge + shared types
│       └── CviTimeline.tsx   Recharts AreaChart with threat zone overlays
└── scripts/
    ├── seed_crisis.py        Seeds Supabase with a 15-point historical crisis arc
    └── live_push.py          Live demo script — escalates CVI to RED in real time
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.10
- A **Supabase** project (Person 1 sets this up and shares credentials)

---

### 🖥 Frontend (Person 2)

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

The dashboard runs fully on **mock data** out of the box — no backend or env vars needed to see the UI.

**To connect to the live backend**, create `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=<from Person 1>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Person 1>
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_BRAND_ID=<output of seed_crisis.py>
```

---

### ⚙️ Backend (Person 1)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # fill in Supabase credentials
uvicorn main:app --reload --port 8000
```

**`backend/.env`**:
```env
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_KEY=your-service-role-or-anon-key
```

---

## 🗄 Supabase Schema

Run these SQL statements in the Supabase SQL editor (one-time, done by Person 1):

```sql
CREATE TABLE IF NOT EXISTS brands (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  keywords   text[],
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS posts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id         uuid REFERENCES brands(id),
  source           text,
  content          text,
  emotion_scores   jsonb,
  cvi_contribution float,
  ingested_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cvi_snapshots (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id    uuid REFERENCES brands(id),
  score       float NOT NULL,
  level       text NOT NULL,
  is_anomaly  bool DEFAULT false,
  recorded_at timestamptz DEFAULT now()
);

-- Indexes & Realtime
CREATE INDEX ON cvi_snapshots (brand_id, recorded_at DESC);
ALTER TABLE cvi_snapshots REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE cvi_snapshots;
```

---

## 🔌 API Reference

Base URL: `http://localhost:8000`

| Method | Route | Description | Response |
|--------|-------|-------------|----------|
| `GET` | `/health` | Health check | `{ status, service }` |
| `GET` | `/cvi?brand_id=<uuid>` | Latest CVI snapshot | `{ score, level, is_anomaly }` |
| `GET` | `/cvi/history?brand_id=<uuid>` | Last 60 snapshots (desc) | `[{ score, level, recorded_at }]` |
| `GET` | `/brands` | List all brands | `[{ id, name, keywords }]` |
| `POST` | `/brands` | Create a brand | `{ id, name, keywords }` |

---

## 🎭 Demo Scripts

### 1. Seed historical data (run once before the demo)

```bash
cd scripts
python seed_crisis.py
# Inserts 15 data points spanning the last 15 minutes
# Prints: brand_id=<uuid>  <-- COPY THIS INTO frontend/.env.local
```

This seeds a realistic escalation arc:
```
T-15min  CVI= 28  [LOW]
T-14min  CVI= 31  [LOW]
...
T-01min  CVI= 90  [CRITICAL]
T-00min  CVI= 91  [CRITICAL]
```

### 2. Live push (run in front of judges)

```bash
python scripts/live_push.py <brand_id>
# Pushes 6 escalating snapshots every 4 seconds
# Gauge climbs from HIGH → CRITICAL live on screen
```

Output:
```
LIVE — judge is watching...
  Pushed CVI=72 [HIGH]
  Pushed CVI=76 [HIGH]
  Pushed CVI=80 [HIGH]
  Pushed CVI=84 [CRITICAL]
  Pushed CVI=88 [CRITICAL]
  Pushed CVI=91 [CRITICAL]
Gauge is RED. Person 2 hits Playbook button.
```

---

## 🧩 Frontend Architecture

### Data Flow (strictly top-down)

```
page.tsx (state owner)
│  useState: currentCvi, cviHistory, alerts, tickCount
│  useEffect: setInterval(tick, 3000)
│
├── <Sidebar />               (no props — navigation only)
├── <CviGauge currentCvi />   (reads score, renders SVG gauge)
├── <CviTimeline cviHistory /> (reads history array, renders chart)
└── <AlertFeed alerts />      (inline in page.tsx — renders event list)
```

### Component Reference

#### `components/Sidebar.tsx`
- Dark navigation shell (`#0a0e1a` background)
- Active route highlight using `usePathname()`
- Nav items: **Home**, **Alerts**, **Playbooks**, **Settings**
- Pulsing "Live feed active" status badge in footer
- Glowing animated brand logo (violet → indigo gradient)

#### `components/CviGauge.tsx`
- **Pure SVG** — no external charting library
- Half-circle arc from 0° (left) → 180° (right) representing CVI 0–100
- Animated needle with CSS transition (`0.6s cubic-bezier`)
- Arc fill and needle color change dynamically per threat level
- Exports `getCviMeta(score)` utility — shared with `page.tsx`
- Exports `ThreatLevel` and `CviDataPoint` types — shared with `CviTimeline`
- Tick marks and labels at 0, 25, 50, 75, 100
- Legend pills below gauge

#### `components/CviTimeline.tsx`
- Built with **Recharts** `AreaChart`
- Violet area-fill gradient under the line
- Color-coded dots per data point (green/yellow/orange/red by level)
- Reference lines at y=40 (Watch), y=60 (Medium), y=75 (High)
- Custom glassmorphism tooltip
- `isAnimationActive={false}` for smooth live-append behavior
- Shows "Collecting data…" placeholder until first tick arrives

#### `app/page.tsx` — Mock Data Engine
```ts
// Fires every 3 seconds
const tick = useCallback(() => {
  const score = randomCvi();          // random 20–95
  const meta  = getCviMeta(score);    // classify level
  // → setCurrentCvi, setCviHistory (capped at 20 points), setAlerts
}, []);

useEffect(() => {
  tick();                             // seed immediately on mount
  const id = setInterval(tick, 3000);
  return () => clearInterval(id);     // cleanup on unmount
}, [tick]);
```

**Alert generation rules:**
- `High` or `Medium` → always fires an alert
- `Watch` or `Low` → fires with 40% probability
- Alert pool capped at **10 most recent** events

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 |
| UI components | shadcn/ui (base-nova style) |
| Charts | Recharts 2 |
| Icons | lucide-react |
| Backend framework | FastAPI |
| Database + Realtime | Supabase (PostgreSQL) |
| Python ORM | supabase-py |

---

## 🌿 Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Stable, reviewed code |
| `feature/frontend-ui` | Frontend dashboard (Person 2) |

```bash
# To merge frontend into main (after demo)
git checkout main
git merge feature/frontend-ui
git push origin main
```

---

## 📋 Checklist for Demo Day

- [ ] Person 1: Supabase tables created + Realtime enabled
- [ ] Person 1: Backend running (`uvicorn main:app --reload --port 8000`)
- [ ] Person 2: `frontend/.env.local` filled with Supabase + brand_id
- [ ] Run `python scripts/seed_crisis.py` → copy `brand_id` output
- [ ] Verify gauge shows historical data in CVI Timeline
- [ ] Open http://localhost:3000 on a visible screen
- [ ] When judges arrive → run `python scripts/live_push.py <brand_id>`
- [ ] Gauge climbs to 🔴 RED live — hit the Playbook button!

---

*PulseSphere AI — built at hackathon speed, enterprise-grade aesthetics.*