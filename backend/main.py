from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv()
app = FastAPI(title='PulseSphere API')
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))

@app.get('/health')
def health(): return {'status': 'ok', 'service': 'pulsesphere'}

@app.get('/cvi')
def get_cvi(brand_id: str = None):
    if brand_id:
        rows = supabase.table('cvi_snapshots').select('*').eq('brand_id', brand_id).order('recorded_at', desc=True).limit(1).execute()
        if rows.data: return rows.data[0]
    return {'score': 28, 'level': 'LOW', 'is_anomaly': False}

@app.post('/brands')
def create_brand(payload: dict):
    result = supabase.table('brands').insert({'name': payload['name'], 'keywords': payload.get('keywords', [])}).execute()
    return result.data[0]

@app.get('/brands')
def list_brands():
    return supabase.table('brands').select('*').execute().data

@app.get('/cvi/history')
def cvi_history(brand_id: str):
    rows = supabase.table('cvi_snapshots').select('*').eq('brand_id', brand_id).order('recorded_at', desc=True).limit(60).execute()
    return rows.data
