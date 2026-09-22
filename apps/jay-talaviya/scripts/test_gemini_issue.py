import os
import requests
import json
from dotenv import load_dotenv

load_dotenv('apps/jay-talaviya/.env.local')
whip_key = os.getenv('WHIPSCRIBE_API_KEY')
gemini_key = os.getenv('GEMINI_API_KEY')
primary_model = os.getenv('GEMINI_PRIMARY_MODEL', 'gemini-3.5-flash-lite')
backup_model = os.getenv('GEMINI_BACKUP_MODEL', 'gemini-3.5-flash')

job_id = '7ec86f3d-a4ac-4a41-9107-70ac7280ef97'
r_whip = requests.get(f'https://whipscribe.com/api/v1/jobs/{job_id}/result?format=json', headers={'X-API-Key': whip_key})
transcript = r_whip.json()
segments = transcript.get('segments', [])

formatted = []
for s in segments:
    m = int(s['start'] // 60)
    sec = int(s['start'] % 60)
    formatted.append(f"[{m:02d}:{sec:02d}] {s.get('speaker') or 'Speaker'}: {s.get('text', '')}")
formatted_text = "\n".join(formatted)

print(f"Total Segments: {len(segments)}")
print(f"Formatted text length: {len(formatted_text)} chars")

prompt = f"""You are an elite Executive Chief of Staff and Principal Intelligence Analyst at a top-tier technology company.
Analyze the following diarized transcript and produce an extraordinary, publication-grade intelligence briefing in the style of Google Meet AI notes, featuring BOTH a SHORT high-level snapshot and a DETAILED long-form breakdown.

TRANSCRIPT:
\"\"\"
{formatted_text[:32000]}
\"\"\"

You MUST return ONLY a strictly valid JSON object matching this exact schema (no commentary outside the JSON):
{{
  "title": "A compelling headline capturing the core objective and milestone (max 10 words)",
  "short_summary": {{
    "overview": "A 2-3 sentence executive summary narrative explaining the trigger for this meeting, the core pivot or consensus reached, and the downstream business/engineering impact.",
    "quick_takeaways": [
      "Immediate takeaway 1",
      "Immediate takeaway 2",
      "Immediate takeaway 3"
    ]
  }},
  "detailed_topics": [
    {{
      "topic": "Topic Heading 1",
      "details": [
        "In-depth analysis of the background challenge, inefficiencies, or user needs addressed.",
        "Specific options, tools, or designs evaluated, including hard metrics, percentages, costs, or benchmark figures cited.",
        "Key trade-offs, debates, or objections raised by attendees and how consensus was established."
      ]
    }}
  ],
  "action_items": [
    "Explicit deliverable with context and target timeframe"
  ],
  "key_decisions": [
    "Specific architectural, business, or operational choice agreed upon, including the rationale"
  ],
  "open_questions": [
    "Important question, risk, or consideration discussed during the call"
  ],
  "key_moments": [
    {{
      "timestamp": "MM:SS",
      "speaker": "SPEAKER_XX",
      "topic": "Topic milestone",
      "quote": "Exact verbatim quote from the transcript",
      "significance": "Why this specific statement was pivotal"
    }}
  ]
}}

STRICT QUALITY RULES:
1. Provide BOTH the concise high-level short summary and the comprehensive multi-topic detailed breakdown.
2. Group the detailed breakdown into 2 to 4 distinct, meaningful topic themes.
3. Ground every point directly in the transcript text.
4. Extract 4 to 8 key timeline anchor moments.
5. Write all action items, decisions, and questions cleanly in natural language without bracket tags."""

for model in [primary_model, backup_model, 'gemini-1.5-flash', 'gemini-2.0-flash']:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_key}"
    try:
        import time
        t0 = time.time()
        res = requests.post(url, json={
            'contents': [{'parts': [{'text': prompt}]}],
            'generationConfig': {
                'temperature': 0.1,
                'responseMimeType': 'application/json'
            }
        }, timeout=30)
        dt = time.time() - t0
        print(f"Model: {model} -> HTTP {res.status_code} in {dt:.2f}s")
        if res.status_code == 200:
            resp_text = res.json()['candidates'][0]['content']['parts'][0]['text']
            print(f"SUCCESS! Output length: {len(resp_text)} chars")
            print("Preview:")
            print(resp_text[:500])
            break
        else:
            print("Error response:", res.text[:300])
    except Exception as e:
        print(f"Model: {model} Exception: {e}")
