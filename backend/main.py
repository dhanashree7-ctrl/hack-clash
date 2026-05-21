from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
from dotenv import load_dotenv
import os
import json

load_dotenv()
app = FastAPI(title='PulseSphere API')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*']
)
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))


# ── Health ─────────────────────────────────────────────────────────────────────

@app.get('/health')
def health():
    return {'status': 'ok', 'service': 'pulsesphere'}


# ── CVI ────────────────────────────────────────────────────────────────────────

@app.get('/cvi')
def get_cvi(brand_id: str = None):
    fallback = {'score': 28, 'level': 'LOW', 'is_anomaly': False, 'minutes_early': 0}

    if not brand_id:
        return fallback

    # Fetch latest snapshot
    rows = supabase.table('cvi_snapshots') \
        .select('*') \
        .eq('brand_id', brand_id) \
        .order('recorded_at', desc=True) \
        .limit(1) \
        .execute()

    if not rows.data:
        return fallback

    latest = rows.data[0]

    # Fetch last 20 scores for anomaly detection
    history = supabase.table('cvi_snapshots') \
        .select('score') \
        .eq('brand_id', brand_id) \
        .order('recorded_at', desc=True) \
        .limit(20) \
        .execute()

    cvi_series = [r['score'] for r in reversed(history.data)]

    # Run pre-echo anomaly detection
    try:
        from anomaly import detect_pre_echo
        anomaly_result = detect_pre_echo(cvi_series)
    except Exception:
        anomaly_result = {'is_anomaly': latest.get('is_anomaly', False), 'minutes_early': 0}

    return {
        'score': latest['score'],
        'level': latest['level'],
        'is_anomaly': anomaly_result['is_anomaly'],
        'minutes_early': anomaly_result.get('minutes_early', 0),
        'recorded_at': latest['recorded_at']
    }


@app.get('/cvi/history')
def cvi_history(brand_id: str):
    rows = supabase.table('cvi_snapshots') \
        .select('*') \
        .eq('brand_id', brand_id) \
        .order('recorded_at', desc=True) \
        .limit(60) \
        .execute()
    return rows.data


# ── Brands ─────────────────────────────────────────────────────────────────────

@app.post('/brands')
def create_brand(payload: dict):
    result = supabase.table('brands').insert({
        'name': payload['name'],
        'keywords': payload.get('keywords', [])
    }).execute()
    return result.data[0]


@app.get('/brands')
def list_brands():
    return supabase.table('brands').select('*').execute().data


# ── Alerts ─────────────────────────────────────────────────────────────────────

@app.post('/alerts/check')
def check_alerts(payload: dict):
    brand_id = payload['brand_id']
    score = payload['score']

    if score >= 90:   severity = 'CRITICAL'
    elif score >= 75: severity = 'HIGH'
    elif score >= 60: severity = 'MEDIUM'
    elif score >= 40: severity = 'WATCH'
    else:
        return {'alert_fired': False}

    try:
        result = supabase.table('alerts').insert({
            'brand_id': brand_id,
            'severity': severity,
            'cvi_score': score,
            'channels_notified': ['email', 'slack']
        }).execute()
        alert_id = result.data[0]['id']
    except Exception:
        alert_id = 'db-unavailable'

    return {
        'alert_fired': True,
        'severity': severity,
        'alert_id': alert_id
    }


# ── Playbook ────────────────────────────────────────────────────────────────────

FALLBACK_PLAYBOOK = {
    'actions': [
        {'step': 1, 'action': 'Pause all scheduled social media posts immediately', 'urgency': 'immediate'},
        {'step': 2, 'action': 'Convene crisis response team within 15 minutes', 'urgency': 'immediate'},
        {'step': 3, 'action': 'Draft holding statement for all media enquiries', 'urgency': 'within_1hr'}
    ],
    'press_statement': (
        'We are aware of the current situation and are taking it very seriously. '
        'Our team is actively investigating and working to resolve the issue. '
        'We will provide a full update within the hour.'
    )
}


@app.post('/playbook')
def generate_playbook(payload: dict):
    brand_id = payload['brand_id']
    cvi_score = payload.get('cvi_score', 85)
    brand_name = payload.get('brand_name', 'the brand')

    api_key = os.getenv('NVIDIA_API_KEY')
    result = FALLBACK_PLAYBOOK

    if api_key:
        import urllib.request
        import json
        import time

        prompt = (
            f'Brand: {brand_name}. CVI Score: {cvi_score}/100 (CRITICAL crisis). '
            f'Give exactly 3 urgent response actions and 1 short press statement. '
            f'Format as JSON: {{"actions": [{{"step": 1, "action": "...", "urgency": "immediate"}}, ...], '
            f'"press_statement": "..."}}. JSON only, no other text.'
        )

        models_to_try = [
            {"name": "deepseek-ai/deepseek-v4-pro", "timeout": 4},
            {"name": "meta/llama-3.1-8b-instruct", "timeout": 5}
        ]

        url = "https://integrate.api.nvidia.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        for model_info in models_to_try:
            model_name = model_info["name"]
            timeout = model_info["timeout"]
            payload_data = {
                "model": model_name,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 1,
                "top_p": 0.95,
                "max_tokens": 600
            }
            if "deepseek" in model_name:
                payload_data["extra_body"] = {"chat_template_kwargs": {"thinking": False}}

            req = urllib.request.Request(
                url,
                data=json.dumps(payload_data).encode('utf-8'),
                headers=headers,
                method="POST"
            )
            try:
                with urllib.request.urlopen(req, timeout=timeout) as response:
                    res_data = response.read().decode('utf-8')
                    res_json = json.loads(res_data)
                    raw_content = res_json['choices'][0]['message']['content'].strip()
                    
                    if raw_content.startswith('```json'):
                        raw_content = raw_content.split('```json', 1)[1].rsplit('```', 1)[0].strip()
                    elif raw_content.startswith('```'):
                        raw_content = raw_content.split('```', 1)[1].rsplit('```', 1)[0].strip()
                    
                    result = json.loads(raw_content)
                    break
            except Exception as e:
                print(f"Model {model_name} failed or timed out: {e}")
                continue

    try:
        supabase.table('playbooks').insert({
            'brand_id': brand_id,
            'actions': result['actions'],
            'press_statement': result['press_statement']
        }).execute()
    except Exception:
        pass  # playbooks table may not exist yet — don't crash

    return result
