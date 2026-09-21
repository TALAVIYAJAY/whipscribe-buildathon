# WhipScribe Audio Intelligence — Engineering Documentation

This document covers the architectural decisions, API contracts, concurrency models, and resilient state handling for the WhipScribe Audio Intelligence application.

---

## 1. System Architecture

The application is structured into four decoupled layers:

```
[ Frontend View Layer ]  -->  [ Next.js API Routes ]  -->  [ WhipScribe REST API ]
         |                             |
         v                             v
  [ Media Player ]            [ Airtable REST API ]
```

### Key Modules:
- `src/lib/whipscribe.ts`: Strongly typed client wrapping WhipScribe's `/api/v1` endpoints:
  - `submitUrl`: Handles YouTube & streaming media URLs.
  - `submitFile`: Multipart upload for raw audio/video files.
  - `waitForJobCompletion`: Non-blocking polling with timeout and error extraction.
  - `getTranscript`: Fetches diarized segments and per-word timestamps (`format=json`).
  - `getAudioUrl`: Retrieves signed CDN playback URLs for uploaded audio files.
- `src/lib/intelligence.ts`: Pure algorithmic extraction layer that derives bulleted takeaways, action items, questions, and timestamp anchors from diarized segments.
- `src/lib/airtable.ts`: Airtable REST API integration with type-safe field payload validation matching Base `appx2rQXn4238eQ0v`.
- `src/lib/sample-data.ts`: Deterministic, offline-capable test dataset for instantaneous evaluator testing.

---

## 2. WhipScribe API Integration Details

### Asynchronous Job Polling Model
Speech transcription is an asynchronous operation. Rather than maintaining an open long-lived connection that might trigger reverse-proxy timeouts (e.g. Vercel 15s-60s timeouts), the application implements an interval polling model:
- Polling interval: `2.5 seconds`.
- Supported job statuses:
  - `queued`: Waiting in Whisper worker queue.
  - `processing`: Active VAD pre-flight and speech-to-text inference.
  - `done`: Complete transcript ready for retrieval.
  - `failed`: Job terminated with error reason.

### Voice Activity Detection (VAD) Compliance
WhipScribe employs Silero VAD. When submitting audio without discernible speech, WhipScribe returns `speech_detected: false`. The intelligence layer inspects this flag and prevents hallucinated transcripts from polluting the user's Airtable database.

---

## 3. Airtable REST Integration & Schema Mapping

The integration maps WhipScribe output to the user's Airtable Base (`appx2rQXn4238eQ0v` / `Table 1`):

| Airtable Field | Type | Source Data |
| :--- | :--- | :--- |
| `Title` | Single line text | Derived topic title or file name |
| `Summary` | Long text | Markdown-formatted bulleted takeaways |
| `Action Items / Questions` | Long text | Checklist of commitments, decisions, and open questions |
| `Key Timestamps` | Long text | Anchors `[MM:SS] (Speaker): "Quote"` |
| `Audio Link` | URL | YouTube link or WhipScribe CDN signed playback URL |
| `WhipScribe Job ID` | Single line text | Official WhipScribe UUID |

---

## 4. State Machine & Resiliency

The application strictly models the 5 states specified in `AGENTS.md`:

1. **Empty State**: Rendered when no media is currently loaded. Displays a clear explanation, supported formats, and an instant 1-Click Sample button.
2. **Loading State**: Features a 4-step animated progress stepper displaying real-time pipeline status (Intake $\rightarrow$ Transcribing $\rightarrow$ Extracting $\rightarrow$ Syncing).
3. **Error State**: Captures both client and server errors (e.g. invalid URL, API quota, timeout) with friendly error messaging and a one-click Retry button.
4. **Done State**: Displays the full briefing, action items checklist, clickable diarized transcript, synchronized media player, and Airtable confirmation card.
5. **Offline State**: Utilizes browser window listeners (`online` and `offline`) to detect loss of connectivity and surface an alert banner before network calls fail.

---

## 5. Security & Secrets Management

- Zero secrets are hardcoded in the codebase.
- API keys (`WHIPSCRIBE_API_KEY` and `AIRTABLE_API_TOKEN`) reside exclusively in local `.env` and `.env.local` files, which are strictly ignored in `.gitignore`.
- Next.js server-side API routes (`/api/transcribe` and `/api/airtable`) act as secure proxies, ensuring API keys are never leaked to client browser bundles.
