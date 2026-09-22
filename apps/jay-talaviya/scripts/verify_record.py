import json
import urllib.request
from smoke_test import load_env, get_ssl_context

env = load_env()
base_id = env["AIRTABLE_BASE_ID"]
table_name = env["AIRTABLE_TABLE_NAME"]
token = env["AIRTABLE_API_TOKEN"]

url = f"https://api.airtable.com/v0/{base_id}/{urllib.parse.quote(table_name)}/recQbDlOCaO8PFUuo"
req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
ctx = get_ssl_context()

with urllib.request.urlopen(req, context=ctx) as resp:
    data = json.loads(resp.read().decode())
    print("Airtable Record Retrieved:")
    print(json.dumps(data, indent=2))
