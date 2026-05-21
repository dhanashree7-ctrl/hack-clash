import os, time
from datetime import datetime, timedelta
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('../backend/.env')
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))

brand = supabase.table('brands').insert({'name': 'Zomato', 'keywords': ['Zomato', 'food delivery']}).execute().data[0]
brand_id = brand['id']
print(f'brand_id={brand_id}  ← COPY THIS INTO frontend/.env.local')

cvi_arc = [28, 31, 35, 38, 44, 51, 59, 65, 71, 76, 81, 85, 88, 90, 91]
levels  = ['LOW', 'LOW', 'LOW', 'LOW', 'WATCH', 'WATCH', 'MEDIUM', 'MEDIUM', 'HIGH', 'HIGH', 'HIGH', 'CRITICAL', 'CRITICAL', 'CRITICAL', 'CRITICAL']

for i, (score, level) in enumerate(zip(cvi_arc, levels)):
    ts = (datetime.utcnow() - timedelta(minutes=15 - i)).isoformat()
    supabase.table('cvi_snapshots').insert({
        'brand_id': brand_id,
        'score': score,
        'level': level,
        'is_anomaly': score > 60,
        'recorded_at': ts
    }).execute()
    print(f'  T-{15 - i:02d}min  CVI={score:3d}  [{level}]')
    time.sleep(0.05)

print('Seed done. Run: python live_push.py ' + brand_id)
