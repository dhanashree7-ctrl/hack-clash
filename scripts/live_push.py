import os, time, sys
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('../backend/.env')
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))
brand_id = sys.argv[1] if len(sys.argv) > 1 else input('brand_id: ')

arc    = [72, 76, 80, 84, 88, 91]
levels = ['HIGH', 'HIGH', 'HIGH', 'CRITICAL', 'CRITICAL', 'CRITICAL']

print('LIVE — judge is watching...')
for score, level in zip(arc, levels):
    supabase.table('cvi_snapshots').insert({
        'brand_id': brand_id,
        'score': score,
        'level': level,
        'is_anomaly': True
    }).execute()
    print(f'  Pushed CVI={score} [{level}]')
    time.sleep(4)

print('Gauge is RED. Person 2 hits Playbook button.')
