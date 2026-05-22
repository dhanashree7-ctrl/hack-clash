# PulseSphere AI

Real-time Brand Crisis Velocity Index (CVI) monitoring dashboard.

---

## 👤 Person 2 — Read this first

### Step 1: Run the backend

```bash
cd backend
pip install fastapi uvicorn supabase python-dotenv
cp .env.example .env        # fill in Supabase creds from Person 1
uvicorn main:app --reload --port 8000
```

### Step 2: Create `frontend/.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=<from Person 1>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Person 1>
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_BRAND_ID=<from seed_crisis.py output>
```

### Step 3: API Contract

| Method | Route | Returns |
|--------|-------|---------|
| GET | `/health` | `{status: "ok"}` |
| GET | `/cvi?brand_id=X` | `{score, level, is_anomaly}` |
| GET | `/cvi/history?brand_id=X` | `[{score, level, recorded_at}]` |
| GET | `/brands` | `[{id, name, keywords}]` |
| POST | `/brands` | `{id, name, keywords}` |

### Step 4: Realtime

- **Table**: `cvi_snapshots` — realtime INSERT events enabled
- Subscribe to inserts → update the CVI gauge on every new row

### Step 5: Demo Sequence

```bash
# Run once BEFORE judges arrive — seeds historical crisis arc
python scripts/seed_crisis.py

# Run IN FRONT OF JUDGES — gauge climbs to RED live
python scripts/live_push.py <brand_id>
```

---

## 🗂 Project Structure

```
/backend       FastAPI + Supabase API
/frontend      Next.js dashboard (Person 2)
/scripts       Seed + live push scripts
```

## 🗄 Supabase SQL (already run by Person 1)

```sql
CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  keywords text[],
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES brands(id),
  source text,
  content text,
  emotion_scores jsonb,
  cvi_contribution float,
  ingested_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cvi_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES brands(id),
  score float NOT NULL,
  level text NOT NULL,
  is_anomaly bool DEFAULT false,
  recorded_at timestamptz DEFAULT now()
);

CREATE INDEX ON cvi_snapshots (brand_id, recorded_at DESC);
ALTER TABLE cvi_snapshots REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE cvi_snapshots;
```