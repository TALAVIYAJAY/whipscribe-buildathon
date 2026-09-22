import json
import urllib.request
import urllib.error
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scripts.smoke_test import load_env, get_ssl_context

env = load_env()
api_key = env.get("GEMINI_API_KEY")
primary_model = env.get("GEMINI_PRIMARY_MODEL", "gemini-3.5-flash-lite")
backup_model = env.get("GEMINI_BACKUP_MODEL", "gemini-3.5-flash")

print(f"[*] Loaded GEMINI_API_KEY: {api_key[:6]}...{api_key[-4:] if api_key else 'NONE'}")
print(f"[*] Primary Model : {primary_model}")
print(f"[*] Backup Model  : {backup_model}")

models = [primary_model, backup_model, "gemini-2.0-flash", "gemini-1.5-flash"]
sample_prompt = "Hello! Output a JSON object with key 'status' and value 'active'."

for model in models:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    req = urllib.request.Request(
        url,
        data=json.dumps({"contents": [{"parts": [{"text": sample_prompt}]}]}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    ctx = get_ssl_context()
    try:
        with urllib.request.urlopen(req, timeout=10, context=ctx) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            raw = data["candidates"][0]["content"]["parts"][0]["text"]
            print(f"[+] Model '{model}' SUCCESS! Response:\n    {raw.strip()}")
            break
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"[!] Model '{model}' HTTP Error {e.code}: {body[:200]}")
    except Exception as e:
        print(f"[!] Model '{model}' Error: {e}")
