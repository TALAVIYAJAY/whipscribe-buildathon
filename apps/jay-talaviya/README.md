# WhipScribe Audio Intelligence &rarr; Airtable Workflow

> **Track 4 Submission: Invent an Audio Intelligence Workflow**  
> **Author:** Jay Talaviya ([GitHub](https://github.com/TALAVIYAJAY) / [Issue #25](https://github.com/neugence/whipscribe-buildathon/issues/25))  
> **Target Role:** Founding Software Engineer at Neugence / WhipScribe

---

## 1. Problem Statement

Every week, founders, researchers, professors, and executive operators record dozens of hours of high-value conversations: user feedback interviews, student lectures, board discussions, and team syncs. 

Yet **over 90% of this audio is never listened to again.**

The reason is simple: **audio is linear, unsearchable, and disconnected from the team's operational database.** Reviewing a 45-minute recording takes 45 minutes. Even when auto-transcribed, standard transcripts dump thousands of words of unstructured text that still requires manual reading, extracting action items, tagging owners, and re-typing them into project trackers like Airtable or Notion.

**WhipScribe Audio Intelligence** bridges this gap in seconds. A user drops an audio/video recording or pastes a public audio/media stream URL (such as a podcast, CDN audio, or web stream). The workflow automatically:
1. Performs speaker-diarized speech recognition with word-level timestamps using the **WhipScribe API**.
2. Extracts high-leverage executive takeaways, an action items/decision matrix, and timestamped quote anchors.
3. Automatically writes a structured, categorized record into a live **Airtable Base** (`Table 1`).
4. Renders an interactive briefing dashboard with structured action items and diarized transcript timeline anchors.

---

## 2. Drawn Workflow

```mermaid
flowchart TD
    subgraph User["1. User Input"]
        A["Public Audio / Media URL (Podcast, CDN, Web Stream)"]
        B["Local Audio File (MP3, WAV, M4A, MP4)"]
    end

    subgraph App["2. WhipScribe Audio Intelligence Next.js App"]
        C["Unified Intake & Validation (/api/transcribe)"]
    end

    subgraph WhipScribe["3. WhipScribe API Engine"]
        D["POST /v1/transcribe/url OR POST /v1/transcribe"]
        E["Poll Job: GET /v1/jobs/{id}"]
        F["GET /v1/jobs/{id}/result?format=json"]
        G["GET /v1/jobs/{id}/audio/url (Hosted Stream)"]
    end

    subgraph Intelligence["4. Intelligence & Extraction Engine"]
        H["Executive Summary Generation"]
        I["Action Items & Decisions Matrix"]
        J["Timeline Anchor Extraction [MM:SS]"]
    end

    subgraph Destinations["5. Automated Output & Actions"]
        K["Airtable REST API (Base: appx2rQXn4238eQ0v)"]
        L["Interactive Intelligence Briefing"]
        M["Diarized Transcript with Timeline Anchors"]
    end

    A --> C
    B --> C
    C --> D
    D --> E
    E --> F
    E --> G
    F --> H
    F --> I
    F --> J
    H --> K
    I --> K
    J --> K
    G --> K
    H --> L
    I --> L
    J --> L
    F --> M
```

---

## 3. How to Run Locally

### Prerequisites
- Node.js `v18+` or `v20+`
- Active WhipScribe API Key & Airtable Personal Access Token

### Steps
```bash
# 1. Navigate to the candidate app directory
cd apps/jay-talaviya

# 2. Configure environment variables (.env.local)
# WHIPSCRIBE_API_KEY=your_key_here
# AIRTABLE_API_TOKEN=your_pat_here
# AIRTABLE_BASE_ID=appx2rQXn4238eQ0v
# AIRTABLE_TABLE_NAME="Table 1"

# 3. Install dependencies
npm install

# 4. Start local development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to test with:
- **YouTube URL / Media Link** (e.g. any YouTube video, podcast link, or audio stream)
- **Direct file upload** (`.mp3`, `.wav`, `.m4a`, `.mp4`)

---

## 4. Live Links & Airtable Base

- **Airtable Synchronization**: Direct REST API integration populating structured records automatically into Airtable.
- **Airtable Base ID**: `appx2rQXn4238eQ0v`
- **Table Name**: `Table 1`
- **Fields Configured**:
  1. `Title` (Single line text)
  2. `Summary` (Long text)
  3. `Action Items / Questions` (Long text)
  4. `Key Timestamps` (Long text)
  5. `Audio Link` (URL)
  6. `WhipScribe Job ID` (Single line text)

---

## 5. What Was Built vs. Left Unfinished

### What Is Built & Verified:
- Full dual-intake interface supporting YouTube/media URLs and drag-and-drop audio file uploads.
- Direct integration with WhipScribe REST API: `POST /api/v1/transcribe/url`, `POST /api/v1/transcribe`, `GET /api/v1/jobs/{id}`, `GET /api/v1/jobs/{id}/result?format=json`, and `GET /api/v1/jobs/{id}/audio/url`.
- Automated intelligence parser creating structured summaries, action items, and timestamp anchors.
- Live sync to Airtable Base creating valid, structured records.
- Timeline anchor tags connecting diarized transcript segments directly to moments in the discussion.
- All 5 states implemented: **Empty**, **Loading**, **Error**, **Done**, and **Offline**.

### What Is Left for Next Milestones:
- Webhook callbacks (`POST /api/v1/webhooks`) to eliminate client polling for extra-long recordings (>30 minutes).
- Direct MCP integration with Cursor / Claude desktop to search across past synced Airtable transcripts.

---

## 6. One-Year Product Vision

Within 12 months, this workflow evolves into the **Autonomous Audio Intelligence Layer** for teams:
1. **Zero-Touch Ingestion**: Connect Zoom, Google Meet, and YouTube channels to automatically transcribe and index without clicking an upload button.
2. **Bi-directional CRM & Issue Sync**: Directly route action items to Linear, Jira, or Slack channels based on speaker identification.
3. **Cross-Meeting Semantic Search**: Use WhipScribe MCP to ask questions across an entire library: *"What did customer X say about our pricing across the last 6 months?"* with exact second-level audio playback.
