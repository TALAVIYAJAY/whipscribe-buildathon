"""
WhipScribe & Airtable API Smoke Test Script.

Validates that WHIPSCRIBE_API_KEY and AIRTABLE credentials in .env are active
and correctly authenticated against real endpoints.
"""

import json
import os
import ssl
import sys
import urllib.error
import urllib.request

ENV_FILE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")


def load_env() -> dict[str, str]:
    """Read all key-values from .env file."""
    env = {}
    if not os.path.exists(ENV_FILE_PATH):
        return env

    with open(ENV_FILE_PATH, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                env[key.strip()] = val.strip().strip('"').strip("'")
    return env


def get_ssl_context():
    """Create SSL context with fallback for local Windows trust stores."""
    try:
        import certifi

        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        pass
    try:
        ctx = ssl.create_default_context()
        return ctx
    except Exception:
        return ssl._create_unverified_context()


def test_whipscribe(api_key: str) -> bool:
    print("\n--- 1. Testing WhipScribe API ---")
    print(f"[*] Loaded Key : {api_key[:8]}...{api_key[-4:] if len(api_key) > 12 else ''}")
    print("[*] Contacting : https://whipscribe.com/api/v1/me...")

    req = urllib.request.Request(
        "https://whipscribe.com/api/v1/me",
        headers={
            "X-API-Key": api_key,
            "User-Agent": "WhipScribe-Buildathon-SmokeTest/1.0",
        },
        method="GET",
    )

    ctx = get_ssl_context()
    try:
        with urllib.request.urlopen(req, timeout=10, context=ctx) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            print("[+] SUCCESS: WhipScribe API Key is active!")
            print(f"    Account Email  : {data.get('email', 'N/A')}")
            print(f"    Account Tier   : {data.get('tier', 'N/A')}")
            print(f"    Retention Days : {data.get('retention_days', 'N/A')}")
            print(f"    Signed In      : {data.get('signed_in', False)}")
            return True
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"[!] HTTP Error {e.code}: {e.reason}")
        print(f"    Response: {body}")
        return False
    except urllib.error.URLError as e:
        # Fallback to unverified context if local Windows root certificate is outdated
        try:
            unverified_ctx = ssl._create_unverified_context()
            with urllib.request.urlopen(req, timeout=10, context=unverified_ctx) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                print("[+] SUCCESS: WhipScribe API Key is active! (via fallback SSL)")
                print(f"    Account Email  : {data.get('email', 'N/A')}")
                print(f"    Account Tier   : {data.get('tier', 'N/A')}")
                print(f"    Retention Days : {data.get('retention_days', 'N/A')}")
                print(f"    Signed In      : {data.get('signed_in', False)}")
                return True
        except Exception as fallback_err:
            print(f"[!] Connection Error: {fallback_err}")
            return False


def test_airtable(pat_token: str, base_id: str, table_name: str) -> bool:
    print("\n--- 2. Testing Airtable API ---")
    if not pat_token or pat_token == "PASTE_YOUR_AIRTABLE_PAT_TOKEN_HERE":
        print("[*] Airtable PAT token not yet set in .env (skipping for now)")
        return False

    url = f"https://api.airtable.com/v0/{base_id}/{urllib.parse.quote(table_name)}?maxRecords=1"
    print(f"[*] Contacting : {url[:50]}...")

    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {pat_token}",
            "User-Agent": "WhipScribe-Buildathon-SmokeTest/1.0",
        },
        method="GET",
    )

    ctx = ssl._create_unverified_context()
    try:
        with urllib.request.urlopen(req, timeout=10, context=ctx) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            records = data.get("records", [])
            print("[+] SUCCESS: Airtable API Token is active and connected!")
            print(f"    Base ID       : {base_id}")
            print(f"    Table Name    : {table_name}")
            print(f"    Current Rows  : {len(records)} record(s) fetched")
            return True
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"[!] Airtable HTTP Error {e.code}: {e.reason}")
        print(f"    Response: {body}")
        return False
    except Exception as err:
        print(f"[!] Airtable Connection Error: {err}")
        return False


def main() -> int:
    print("=" * 60)
    print("  WhipScribe & Airtable Smoke Test")
    print("=" * 60)

    env = load_env()
    whip_key = env.get("WHIPSCRIBE_API_KEY")

    if not whip_key or whip_key == "YOUR_API_KEY_HERE":
        print("\n[!] Error: WHIPSCRIBE_API_KEY not set in .env")
        return 1

    whip_ok = test_whipscribe(whip_key)
    air_ok = test_airtable(
        env.get("AIRTABLE_API_TOKEN", ""),
        env.get("AIRTABLE_BASE_ID", "appx2rQXn4238eQ0v"),
        env.get("AIRTABLE_TABLE_NAME", "Table 1"),
    )

    print("\n" + "=" * 60)
    print("  Smoke Test Summary:")
    print(f"  • WhipScribe API : {'PASSED [OK]' if whip_ok else 'FAILED [X]'}")
    print(f"  • Airtable API   : {'PASSED [OK]' if air_ok else 'PENDING TOKEN'}")
    print("=" * 60 + "\n")

    return 0 if whip_ok else 1


if __name__ == "__main__":
    sys.exit(main())
