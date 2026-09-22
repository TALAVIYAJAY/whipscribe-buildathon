import requests
import re
import time

t0 = time.time()
url = "https://www.youtube.com/watch?v=fr1f84rg4Nw"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
}

r = requests.get(url, headers=headers, timeout=5)
dt = time.time() - t0
print(f"Fetched in {dt:.2f}s, status: {r.status_code}")

# Check approxDurationMs or lengthSeconds
m_sec = re.search(r'["\']lengthSeconds["\']:\s*["\']?(\d+)', r.text)
if m_sec:
    sec = int(m_sec.group(1))
    print(f"Found lengthSeconds: {sec}s ({sec/60:.1f} mins)")

m_dur = re.search(r'["\']approxDurationMs["\']:\s*["\']?(\d+)', r.text)
if m_dur:
    ms = int(m_dur.group(1))
    print(f"Found approxDurationMs: {ms}ms ({ms/60000:.1f} mins)")

m_meta = re.search(r'itemprop=["\']duration["\'] content=["\']PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?["\']', r.text)
if m_meta:
    print(f"Found meta duration: {m_meta.group(0)}")
