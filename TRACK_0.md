# Track 0: Track Record & Introduction — Jay Talaviya

## About Me
I am a Full-Stack Python & Next.js engineer specializing in building AI-driven production workflows, automated evaluation engines, and real-time audio/voice pipelines. I focus on building resilient backend architectures, intuitive user interfaces, and self-recovering distributed systems.

- **Email**: talaviyajay10@gmail.com
- **LinkedIn**: https://www.linkedin.com/in/jay-talaviya-ab5b0b1b6/
- **GitHub**: https://github.com/TALAVIYAJAY
- **Buildathon Entry Issue**: https://github.com/neugence/whipscribe-buildathon/issues/25

---

## Track Record

- LinkedIn: https://www.linkedin.com/in/jay-talaviya-ab5b0b1b6/
- Shipped apps: https://www.shikshakai.com/
- Hackathon wins: 
- Team lead: Led backend development for autograding, payments, and real-time voice platform workflows.
- Team projects: https://www.shikshakai.com/ (end-to-end autograding, voice agent, and school reporting systems)
- Proudest work: https://www.shikshakai.com/ (production platform with autograding engine, real-time voice agents, and analytics)
- Contributions elsewhere: 

---

## What Running Shipped Apps Taught Me

Building and operating production educational and AI applications like **ShikshaKai** taught me:
1. **Low-Latency Audio Pipelines**: Audio streaming and transcription requires resilient state management, instant feedback, and graceful handling of socket/network drops.
2. **Idempotent Webhook & Payment Handling**: Systems must never double-bill or corrupt state during asynchronous lifecycle events.
3. **Resilient AI State Machines**: Relying on external LLM APIs requires strict timeout controls, exponential backoffs, and deterministic fallback extractors so users never hit an unhandled error state.

---

## Key Open Source & Production Repositories

- [**ShikshaKai**](https://www.shikshakai.com/): Production platform with automated grading, voice agents, and school analytics.
- [**ai-supervisor**](https://github.com/TALAVIYAJAY/ai-supervisor): Multi-agent supervision and workflow coordination architecture.
- [**mediflow-ai**](https://github.com/TALAVIYAJAY/mediflow-ai): Healthcare intelligence and clinical workflow automation.
- [**chatslack**](https://github.com/TALAVIYAJAY/chatslack): Team messaging and real-time collaboration backend.
- [**alarm-clock**](https://github.com/TALAVIYAJAY/alarm-clock): Thread-safe Python CLI scheduling architecture with unit-tested time abstractions.

---

## Planned Buildathon Tracks

1. **Track 0 (Required)**: Introduction and track record pull request.
2. **Track 1 (Required)**: Mobile and desktop UI/UX bug analysis and next-pass redesign for the transcript reader (`challenges/01-mobile-transcript/`).
3. **Track 4 (Invent a Workflow)**: **WhipScribe Audio Intelligence** — an end-to-end cloud pipeline converting meetings, lectures, and interviews into executive briefings and syncing structured records to Airtable.
   - **Live Production App**: [https://whipscribe-buildathon.vercel.app/](https://whipscribe-buildathon.vercel.app/)
   - **Repository Branch**: [`track-4/audio-intelligence`](https://github.com/TALAVIYAJAY/whipscribe-buildathon/tree/track-4/audio-intelligence)

---

## Checklist

### UI and UX
- [x] Every screen has designed empty, loading, error and done states
- [x] Works on a phone-sized screen, or has a clear reason not to
- [x] Keyboard reachable, readable contrast, labelled controls
- [x] Copy is in the user's words, not the system's
- [x] The first run is designed: what a new user sees before any data

### Building with AI
- [x] The README explains the decisions, not just the features
- [x] Commits are small and named for the change
- [x] I removed or rewrote something the tool produced, and say what and why
- [x] No invented API behaviour: every call matches the docs or a real response

### Finishing
- [x] One full flow works end to end from a clean install
- [x] The README says exactly what does not work yet
- [x] Install and run instructions work on a machine that is not mine

### Ownership and teamwork
- [x] My LinkedIn is in my introduction and on my GitHub profile
- [x] I linked repos where the commit history is mine, not a fork's
- [x] One of them is a complex project I owned from start to finish
- [x] I have shipped work alongside a team, and can say what I did and what they did

### Self-drive
- [x] I opened a pull request with my current work and repos before being asked
- [x] I chose my own scope and said why

### Learning
- [x] I name something that was new to me and how I learned it
- [x] I describe a thing that went wrong and how I found and fixed it
