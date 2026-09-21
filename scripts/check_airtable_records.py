import json
import urllib.parse
import urllib.request
import sys
import os

# Add repo root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scripts.smoke_test import load_env, get_ssl_context

env = load_env()
base_id = env["AIRTABLE_BASE_ID"]
table_name = env["AIRTABLE_TABLE_NAME"]
token = env["AIRTABLE_API_TOKEN"]

url = f"https://api.airtable.com/v0/{base_id}/{urllib.parse.quote(table_name)}?maxRecords=10"
req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
ctx = get_ssl_context()

try:
    with urllib.request.urlopen(req, context=ctx) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        records = data.get("records", [])
        print(f"[+] Total records found: {len(records)}\n")
        for i, r in enumerate(records, 1):
            print(f"--- Record #{i} (ID: {r.get('id')}) ---")
            fields = r.get("fields", {})
            for k, v in fields.items():
                print(f"  [{k}]:")
                val_str = str(v)
                if len(val_str) > 300:
                    val_str = val_str[:300] + "... [truncated]"
                print(f"    {val_str}")
            print()
except Exception as e:
    print(f"[!] Error fetching records: {e}")
