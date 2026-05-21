import urllib.request, json, subprocess, os

base = 'http://localhost:8000'
brand_id = '3c9505ff-1d74-4465-905c-5026e98b288a'
results = {}

# V1 - cvi_engine.py exists
v1 = os.path.exists('backend/cvi_engine.py')
results['V1'] = 'PASS' if v1 else 'FAIL'
print('V1 cvi_engine.py exists:', results['V1'])

# V2 - anomaly.py exists
v2 = os.path.exists('backend/anomaly.py')
results['V2'] = 'PASS' if v2 else 'FAIL'
print('V2 anomaly.py exists:', results['V2'])

# V3 - /cvi returns is_anomaly
try:
    r = urllib.request.urlopen(base + '/cvi?brand_id=' + brand_id, timeout=60)
    cvi = json.loads(r.read())
    v3 = 'is_anomaly' in cvi
    results['V3'] = 'PASS' if v3 else 'FAIL'
    print('V3 /cvi has is_anomaly:', results['V3'], '->', cvi)
except Exception as e:
    results['V3'] = 'FAIL'
    print('V3 FAIL:', e)

# V5 - POST /alerts/check
try:
    data = json.dumps({'brand_id': brand_id, 'score': 91}).encode()
    req = urllib.request.Request(base + '/alerts/check', data=data, headers={'Content-Type':'application/json'}, method='POST')
    r = urllib.request.urlopen(req, timeout=10)
    alert = json.loads(r.read())
    v5 = alert.get('alert_fired') == True and 'alert_id' in alert
    results['V5'] = 'PASS' if v5 else 'FAIL'
    print('V5 /alerts/check:', results['V5'], '->', alert)
except Exception as e:
    results['V5'] = 'FAIL'
    print('V5 FAIL:', e)

# V6 - NVIDIA_API_KEY in .env
try:
    env_content = open('backend/.env').read()
    has_key = 'NVIDIA_API_KEY' in env_content
    is_placeholder = 'your_nvidia_key_here' in env_content or env_content.split('NVIDIA_API_KEY=')[-1].strip().startswith('\n') if has_key else True
    results['V6'] = 'PASS' if (has_key and not is_placeholder) else 'MISSING - need real key'
    print('V6 NVIDIA_API_KEY:', results['V6'])
except Exception as e:
    results['V6'] = 'FAIL'
    print('V6 FAIL:', e)

# V8 - POST /playbook returns 3 actions
try:
    data = json.dumps({'brand_id': brand_id, 'cvi_score': 91, 'brand_name': 'Zomato'}).encode()
    req = urllib.request.Request(base + '/playbook', data=data, headers={'Content-Type':'application/json'}, method='POST')
    r = urllib.request.urlopen(req, timeout=15)
    pb = json.loads(r.read())
    v8 = len(pb.get('actions', [])) == 3 and 'press_statement' in pb
    results['V8'] = 'PASS' if v8 else 'FAIL'
    print('V8 /playbook:', results['V8'], '- actions:', len(pb.get('actions', [])), '- press_statement:', 'press_statement' in pb)
    print('   step1:', pb['actions'][0]['action'])
except Exception as e:
    results['V8'] = 'FAIL'
    print('V8 FAIL:', e)

# V10 - pip packages installed
try:
    out = subprocess.run(['pip', 'show', 'anthropic', 'scikit-learn', 'numpy'], capture_output=True, text=True)
    found = [line.split(': ')[1] for line in out.stdout.splitlines() if line.startswith('Name:')]
    v10 = len(found) == 3
    results['V10'] = 'PASS' if v10 else ('FAIL - found: ' + str(found))
    print('V10 pip packages:', results['V10'], '->', found)
except Exception as e:
    results['V10'] = 'FAIL'
    print('V10 FAIL:', e)

# V11 - requirements.txt has new packages
try:
    req_txt = open('backend/requirements.txt').read()
    missing = [p for p in ['anthropic', 'scikit-learn', 'numpy'] if p not in req_txt]
    results['V11'] = 'PASS' if not missing else ('FAIL missing: ' + str(missing))
    print('V11 requirements.txt:', results['V11'])
except Exception as e:
    results['V11'] = 'FAIL'
    print('V11 FAIL:', e)

# V12 - git status
try:
    status = subprocess.run(['git', 'status', '--short'], capture_output=True, text=True).stdout.strip()
    log = subprocess.run(['git', 'log', '--oneline', '-3'], capture_output=True, text=True).stdout.strip()
    results['V12'] = 'STAGED' if status else 'CLEAN'
    print('V12 git status:', results['V12'])
    print('   staged:', status if status else '(none)')
    print('   log:', log)
except Exception as e:
    results['V12'] = 'FAIL'
    print('V12 FAIL:', e)

print()
print('=== SUMMARY ===')
for k, v in sorted(results.items()):
    icon = 'OK' if v == 'PASS' else ('~~' if 'MISSING' in str(v) or 'STAGED' in str(v) else 'XX')
    print(icon, k + ':', v)

manual = ['V4 (alerts table in Supabase) - check Table Editor', 'V7 (playbooks table in Supabase) - check Table Editor', 'V9 (playbook row saved) - check Table Editor after V8']
print()
print('MANUAL CHECKS NEEDED:')
for m in manual:
    print(' -', m)
