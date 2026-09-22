import requests

def test_youtube_innertube(video_id: str, max_sec: int = 600) -> bool:
    try:
        r = requests.post(
            "https://www.youtube.com/youtubei/v1/player",
            json={
                "context": {"client": {"clientName": "WEB", "clientVersion": "2.20230522.01.00"}},
                "videoId": video_id,
            },
            headers={"User-Agent": "Mozilla/5.0"},
            timeout=5,
        )
        if r.status_code != 200:
            return False
        sec = int(r.json().get("videoDetails", {}).get("lengthSeconds", "0"))
        return sec > 0 and sec <= (max_sec + 30)
    except Exception:
        return False

def test_gdrive_probe(file_id: str, max_bytes: int = 40 * 1024 * 1024) -> bool:
    try:
        url = f"https://drive.google.com/uc?export=download&id={file_id}"
        r = requests.head(url, allow_redirects=True, timeout=5)
        if r.status_code != 200:
            return False
        content_length = int(r.headers.get("content-length", "0"))
        return content_length > 0 and content_length <= max_bytes
    except Exception:
        return False
