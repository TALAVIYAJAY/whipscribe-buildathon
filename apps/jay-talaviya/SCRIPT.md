# Track 4: Video Demo Walkthrough Script (2 Minutes)

> **Application**: WhipScribe Audio Intelligence &rarr; Airtable Workflow  
> **Candidate**: Jay Talaviya ([GitHub](https://github.com/TALAVIYAJAY) / [Issue #25](https://github.com/neugence/whipscribe-buildathon/issues/25) / [PR #90](https://github.com/neugence/whipscribe-buildathon/pull/90))  
> **Target Role**: Founding Software Engineer at Neugence / WhipScribe  
> **Live Production App**: [https://whipscribe-buildathon.vercel.app/](https://whipscribe-buildathon.vercel.app/)  
> **Target Duration**: Exactly 1 minute 50 seconds to 2 minutes 10 seconds  

---

## 📋 Pre-Recording Setup (2-Minute Prep)

1. **Tab 1 (Browser)**: Live Production Web App  
   👉 `https://whipscribe-buildathon.vercel.app/`
2. **Tab 2 (Browser)**: Airtable Base Dashboard  
   👉 `https://airtable.com/` (Base `appx2rQXn4238eQ0v` / `Table 1`)
3. **Recommended Test Vector for Video**:  
   👉 **`direct_03_executive_memo.mp4`** (or **`gdrive_03_founder_update.mp4`**)  
   *Why: It is only 17 seconds long, meaning the live WhipScribe transcription + Gemini synthesis + Airtable sync completes in just ~15 seconds while you speak!*
4. **Dry Run (Crucial Pro Tip)**:  
   *Run the scenario once 1 minute before recording to warm up the pipeline. Then refresh Tab 1 so you start with a clean homepage.*
5. **Recording Tool**: **Loom** (recommended for instant public link), **OBS**, or **Windows Game Bar** (`Win + Alt + R`). Camera/face is optional — clear voice and crisp screen capture are what matter!

---

## 🎬 Minute-by-Minute Speaking Script

---

### [0:00 – 0:25] Introduction & The Unaddressed Audio Problem

* **Screen Action**:  
  Show the clean homepage of your live application (`https://whipscribe-buildathon.vercel.app/`). Hover over the header title *"WhipScribe Audio Intelligence"* and the candidate badge.

* **What to Say**:  
  > *"Hi everyone, my name is Jay Talaviya, and this is my Track 4 submission for the WhipScribe Buildathon: **WhipScribe Audio Intelligence to Airtable Workflow**.*
  > 
  > *Every week, product leaders, researchers, and executive operators record dozens of hours of high-value conversations: user interviews, team syncs, and client memos. Yet over 90% of this audio is never listened to again. Audio is linear and disconnected from operational databases, and manually reading through 20-page transcripts to extract tasks is exhausting.*
  > 
  > *I built a production full-stack application that solves this by converting unstructured recordings into executive briefings and syncing structured records directly to Airtable in seconds."*

---

### [0:25 – 0:50] Universal 10-Minute Credit Guardrail & 6 Demo Vectors

* **Screen Action**:  
  1. Point cursor to the intake tabs: `Public Cloud / Audio URL`, `Direct File Upload`, and hover over the yellow badge: `⏱️ Cap: Max 10 Mins`.  
  2. Scroll down briefly to show **"Quick-Launch Demo Scenarios & Test Files"** with the **"6 Curated Vectors"** badge.

* **What to Say**:  
  > *"Our intake supports both public cloud media links and direct local file uploads.*
  > 
  > *A core architectural principle of this app is **Universal Credit Protection**. To prevent draining the user's WhipScribe API credits on oversized files, I engineered an end-to-end **10-minute pre-flight guardrail**: YouTube links are checked via player probes in 300 milliseconds, Google Drive streams are validated for size and access, and local files are decoded in-browser using HTML5 audio before upload.*
  > 
  > *For evaluators who don't have an audio file on hand, I built an interactive showcase of **6 curated test vectors** across WAV, MP3, MP4, and Google Drive, complete with in-browser audio previews.*
  > 
  > *Let's launch a live scenario right now."*

---

### [0:50 – 1:15] Live Pipeline Execution (Watch the 4-Step Stepper!)

* **Screen Action**:  
  1. Under Quick-Launch Demo Scenarios, click **"Run Live Scenario"** on **Executive Voice Memo (`direct_03_executive_memo.mp4`)** (or click the Google Drive tab and run Founder Update).  
  2. The page automatically scrolls up to the `MediaInput` card, populates the file, and starts the live pipeline.  
  3. Keep cursor around the active **4-Step Stepper**:
     - *Step 1: Validating Audio*
     - *Step 2: Transcribing with WhipScribe (GPU cluster)*
     - *Step 3: Synthesizing Intelligence with Gemini 3.5 AI*
     - *Step 4: Syncing structured record to Airtable*

* **What to Say** *(Speak this while the pipeline processes for ~15 seconds)*:  
  > *"Notice how clicking the scenario immediately resets any stale session data, populates our input form, and triggers the live pipeline.*
  > 
  > *Under the hood, the audio is submitted directly to the **WhipScribe API** for speaker-diarized speech recognition with word-level timestamps.*
  > 
  > *The diarized transcript is then synthesized by **Google Gemini 3.5**, which extracts high-leverage takeaways, an actionable decision matrix, and timeline quote anchors.*
  > 
  > *And in just 15 seconds, our complete intelligence briefing is ready!"*

---

### [1:15 – 1:35] Exploring the Intelligence Briefing & Diarized Transcript

* **Screen Action**:  
  1. Scroll through the generated briefing dashboard:
     - Point to **Executive Takeaways** (bullet points).
     - Point to **Action Items & Decision Matrix** (tasks with owners).
     - Point to **Key Timeline Quotes** with speaker labels and timestamps (e.g., `[0:04] Speaker 1`).
  2. Click a timestamp anchor or play button in the transcript to demonstrate real-time audio synchronization.

* **What to Say**:  
  > *"Here is the generated executive briefing.*
  > 
  > *We have high-level key takeaways, a clear action items checklist, and key timeline quotes attributed to specific speakers.*
  > 
  > *Everything is synchronized — clicking any timestamp anchor jumps the built-in media player directly to that second in the original audio."*

---

### [1:35 – 1:55] Automated Airtable Database Sync (The Climax!)

* **Screen Action**:  
  1. Point to the green **"Airtable Synced Record Card"** at the top right of the dashboard showing the Record ID.  
  2. **Switch to Tab 2 (Airtable Base `Table 1`)**.  
  3. Point your cursor at the newly created top row showing:
     - `Title`
     - `Summary`
     - `Action Items / Questions`
     - `Key Timestamps`
     - `Audio Link`
     - `WhipScribe Job ID`

* **What to Say**:  
  > *"Crucially, this workflow completely eliminates manual data entry. The moment AI synthesis completes, our backend calls the **Airtable REST API**, automatically writing a permanent, structured record into our operational database.*
  > 
  > *As you can see live in Airtable Table 1, the new record is already here: executive takeaways, action items, timestamped evidence, and the WhipScribe job ID.*
  > 
  > *A 45-minute unstructured call is now an indexed, actionable company asset."*

---

### [1:55 – 2:10] Wrap-up, Architecture & Vision

* **Screen Action**:  
  Switch back to Tab 1 (the live web app), scroll up to the header showing *"Built by Jay Talaviya"*.

* **What to Say**:  
  > *"The entire system is deployed live in production on Vercel at `whipscribe-buildathon.vercel.app`, built with zero state clashing, offline detection, and resilient error recovery.*
  > 
  > *Our one-year vision is turning this into an autonomous audio intelligence layer for teams — connecting Google Meet and Zoom directly to Airtable and Linear.*
  > 
  > *Thank you to the Neugence team for reviewing my submission!"*

---

## 💡 Pro Tips for a Perfect 2-Minute Recording

| Tip | Why It Matters |
| :--- | :--- |
| **Run 1 test right before hitting record** | Ensures the API connection and Airtable are warm and you feel confident with the timing. |
| **Use `direct_03_executive_memo.mp4`** | At 17 seconds, it finishes transcription in ~10s, keeping your video snappy and strictly under 2:10. |
| **Keep speaking during the 15s loading** | While the 4-step stepper animates, explain the WhipScribe + Gemini + Airtable pipeline — it makes the video feel ultra-professional. |
| **Clear microphone, steady pace** | Don't rush; speaking calmly and confidently creates a senior engineer impression. |
| **If you stumble, restart Loom** | A 2-minute video takes only 2 minutes to re-record. Don't hesitate to do 2 or 3 takes until you love it! |
