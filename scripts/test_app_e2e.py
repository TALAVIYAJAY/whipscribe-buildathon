"""
End-to-End Verification Test for WhipScribe Audio Intelligence App
Tests:
1. Home page rendering (HTTP 200)
2. Sample API endpoint (/api/sample)
3. Airtable Sync API endpoint (/api/airtable)
"""

import json
import urllib.request
import urllib.error

def test_endpoint(name, url, method="GET", data=None):
    print(f"\n[*] Testing {name}: {url}")
    headers = {"Content-Type": "application/json"} if data else {}
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8") if data else None,
        headers=headers,
        method=method
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            status = resp.status
            content = resp.read().decode("utf-8")
            print(f"[+] Status {status} OK")
            if "application/json" in resp.headers.get("Content-Type", ""):
                parsed = json.loads(content)
                return parsed
            return content
    except urllib.error.HTTPError as e:
        print(f"[!] HTTP Error {e.code}: {e.read().decode('utf-8')}")
        return None
    except Exception as e:
        print(f"[!] Error: {e}")
        return None

if __name__ == "__main__":
    print("=== STARTING LOCAL E2E VERIFICATION ===")

    # 1. Test Home Page
    home = test_endpoint("Home Page", "http://localhost:3000/")
    assert home is not None, "Home page failed to load"
    assert "WhipScribe" in home, "Home page missing WhipScribe branding"
    print("[OK] Home Page Loaded Successfully")

    # 2. Test Sample Route
    sample = test_endpoint("Sample API Route", "http://localhost:3000/api/sample")
    assert sample and sample.get("success"), "Sample endpoint failed"
    print(f"[OK] Sample API Success: Job ID '{sample.get('job_id')}', Title '{sample['intelligence']['title']}'")

    # 3. Test Airtable Sync Route
    print("\n[*] Testing live Airtable sync via /api/airtable...")
    payload = {
        "title": "Smoke Test: WhipScribe Audio Intelligence",
        "summary": "• Automated end-to-end verification of WhipScribe Audio Intelligence workflow.\n• Confirms seamless data flow from audio transcript to Airtable database.",
        "actionItems": "1. [00:15] Verify row creation in Airtable Base appx2rQXn4238eQ0v.\n2. [00:30] Confirm all 6 fields populated correctly.",
        "keyTimestamps": '[00:00] (System): "Testing audio sync pipeline."\n[00:15] (WhipScribe): "Transcription verified."',
        "audioLink": "https://actions.google.com/sounds/v1/ambiences/office_room_tone.ogg",
        "jobId": "test-whipscribe-verify-001"
    }
    airtable_resp = test_endpoint("Airtable Sync API", "http://localhost:3000/api/airtable", method="POST", data=payload)
    assert airtable_resp and airtable_resp.get("success"), f"Airtable sync failed: {airtable_resp}"
    print(f"[OK] Airtable Row Synced Successfully! Record ID: {airtable_resp.get('record_id')}")
    print(f"    Base URL: {airtable_resp.get('base_url')}")

    print("\n=== ALL LOCAL TESTS PASSED [100% OK] ===")
