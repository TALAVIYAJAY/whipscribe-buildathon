import json
import urllib.parse
import urllib.request
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scripts.smoke_test import load_env, get_ssl_context

env = load_env()
base_id = env["AIRTABLE_BASE_ID"]
table_name = env["AIRTABLE_TABLE_NAME"]
token = env["AIRTABLE_API_TOKEN"]

record_id = "recaLZrs45XZVVSHU"
url = f"https://api.airtable.com/v0/{base_id}/{urllib.parse.quote(table_name)}/{record_id}"
req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
ctx = get_ssl_context()

with urllib.request.urlopen(req, context=ctx) as resp:
    data = json.loads(resp.read().decode("utf-8"))
    print("RECORD DETAILS FOR YOUTUBE URL:")
    print(json.dumps(data.get("fields", {}), indent=2))
