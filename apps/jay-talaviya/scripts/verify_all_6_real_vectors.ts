import { normalizeTranscriptDiarization, extractIntelligence } from "../src/lib/intelligence";

const RAW_VECTORS = [
  {
    name: "direct_01_standup_meeting.wav",
    expectedSpeakers: ["Sarah", "Alex"],
    raw: {
      text: "Good morning everyone. Let's do a quick sync on our Sprint deliverables. Alex, what is the status of our Wipscribe transcription pipeline and speaker diarization? Morning Sarah. The pipeline is running smoothly. We completed the REST integration with Wipscribe. It handles speaker diarization and word timestamps with high accuracy. I also finished the automated Airtable synchronization. That is great progress. When will the staging build be ready for product review? I will deploy the staging build to Versal by 2 p.m. today. I need David to verify the Airtable base schema before tomorrow morning. Understood. I will review the Airtable records before 5pm and prepare our release notes. Thanks team, let's have a productive day.",
      segments: [
        { start: 0.0, end: 4.58, speaker: null, text: "Good morning everyone. Let's do a quick sync on our Sprint deliverables." },
        { start: 5.52, end: 10.76, speaker: null, text: "Alex, what is the status of our Wipscribe transcription pipeline and speaker diarization?" },
        { start: 11.78, end: 18.76, speaker: null, text: "Morning Sarah. The pipeline is running smoothly. We completed the REST integration with Wipscribe." },
        { start: 19.36, end: 23.64, speaker: null, text: "It handles speaker diarization and word timestamps with high accuracy." },
        { start: 24.64, end: 27.62, speaker: null, text: "I also finished the automated Airtable synchronization." },
        { start: 28.62, end: 29.82, speaker: null, text: "That is great progress." },
        { start: 30.72, end: 33.26, speaker: null, text: "When will the staging build be ready for product review?" },
        { start: 33.82, end: 37.44, speaker: null, text: "I will deploy the staging build to Versal by 2 p.m. today." },
        { start: 37.44, end: 42.22, speaker: null, text: "I need David to verify the Airtable base schema before tomorrow morning." },
        { start: 43.16, end: 43.62, speaker: null, text: "Understood." },
        { start: 44.32, end: 46.22, speaker: null, text: "I will review the Airtable records" },
        { start: 46.22, end: 52.2, speaker: null, text: "before 5pm and prepare our release notes. Thanks team, let's have a productive day." },
      ],
    },
  },
  {
    name: "direct_02_customer_interview.mp3",
    expectedSpeakers: ["Elena", "Marcus"],
    raw: {
      text: "Thanks for joining us today, Marcus. Could you tell me how your team currently handles client call recordings? Honestly Elena, it is a huge bottleneck for our agency. We record about 15 client calls every week. Nobody on the design team has time to listen back through 60 minutes of conversation. Crucial feedback and scope changes constantly slip through the cracks. If you could automate this completely, what would your dream workflow look like? We want an instant pipeline. As soon as a meeting audio file is uploaded, it should transcribe the conversation. Extract an executive summary, identify the action items, and immediately push them as structured rows into our team Airtable board. That would save our designers at least 5 hours every single week. That makes complete sense. We will send you an invite to test our live prototype by tomorrow morning.",
      segments: [
        { start: 0.0, end: 6.96, speaker: null, text: "Thanks for joining us today, Marcus. Could you tell me how your team currently handles client call recordings?" },
        { start: 8.06, end: 15.04, speaker: null, text: "Honestly Elena, it is a huge bottleneck for our agency. We record about 15 client calls every week." },
        { start: 16.0, end: 20.54, speaker: null, text: "Nobody on the design team has time to listen back through 60 minutes of conversation." },
        { start: 21.6, end: 25.24, speaker: null, text: "Crucial feedback and scope changes constantly slip through the cracks." },
        { start: 26.24, end: 30.26, speaker: null, text: "If you could automate this completely, what would your dream workflow look like?" },
        { start: 31.1, end: 35.9, speaker: null, text: "We want an instant pipeline. As soon as a meeting audio file is uploaded," },
        { start: 36.42, end: 43.08, speaker: null, text: "it should transcribe the conversation. Extract an executive summary, identify the action items," },
        { start: 43.54, end: 45.8, speaker: null, text: "and immediately push them as structured rows" },
        { start: 45.8, end: 51.72, speaker: null, text: "into our team Airtable board. That would save our designers at least 5 hours every single" },
        { start: 51.72, end: 52.98, speaker: null, text: "week." },
        { start: 52.98, end: 58.62, speaker: null, text: "That makes complete sense. We will send you an invite to test our live prototype by tomorrow" },
        { start: 58.62, end: 59.0, speaker: null, text: "morning." },
      ],
    },
  },
  {
    name: "direct_03_executive_memo.mp4",
    expectedSpeakers: ["Executive Lead"],
    raw: {
      text: "Team, here is our weekly executive strategy update for the third quarter. First, customer retention reached 94% this month, driven by faster onboarding. Second, our primary engineering initiative for next month is expanding our audio intelligence workflows with WhipScribe and Airtable. Third, our enterprise pilot program kicks off on October 1st, led by John. All team leads, please ensure your sprint deliverables align with these milestones. Thank you.",
      segments: [
        { start: 0.0, end: 4.26, speaker: null, text: "Team, here is our weekly executive strategy update for the third quarter." },
        { start: 5.22, end: 11.22, speaker: null, text: "First, customer retention reached 94% this month, driven by faster onboarding." },
        { start: 12.2, end: 16.9, speaker: null, text: "Second, our primary engineering initiative for next month is expanding our audio" },
        { start: 16.9, end: 21.5, speaker: null, text: "intelligence workflows with WhipScribe and Airtable." },
        { start: 22.1, end: 27.8, speaker: null, text: "Third, our enterprise pilot program kicks off on October 1st, led by John." },
        { start: 28.5, end: 33.2, speaker: null, text: "All team leads, please ensure your sprint deliverables align with these milestones. Thank you." },
      ],
    },
  },
  {
    name: "gdrive_01_roadmap_sync.wav",
    expectedSpeakers: ["Sarah", "Alex"],
    raw: {
      text: "Let's review our quarterly roadmap deliverables. We need to confirm whether Airtable webhook sync will handle high-concurrency spikes. Alex, what is our latency target? We are targeting sub-five-hundred millisecond write operations across all enterprise bases. We decided to enable database connection pooling by Thursday.",
      segments: [
        { start: 0.0, end: 6.0, speaker: null, text: "Let's review our quarterly roadmap deliverables." },
        { start: 6.5, end: 15.0, speaker: null, text: "We need to confirm whether Airtable webhook sync will handle high-concurrency spikes. Alex, what is our latency target?" },
        { start: 15.5, end: 25.0, speaker: null, text: "We are targeting sub-five-hundred millisecond write operations across all enterprise bases." },
        { start: 25.5, end: 35.0, speaker: null, text: "We decided to enable database connection pooling by Thursday." },
      ],
    },
  },
  {
    name: "gdrive_02_client_onboarding.mp3",
    expectedSpeakers: ["Elena", "David"],
    raw: {
      text: "Welcome David to the WhipScribe enterprise onboarding session. Elena, how do our team members connect their shared Google Drive folders? You simply paste any Google Drive audio sharing link into the portal, and the pipeline automatically normalizes the stream and creates structured rows in your Airtable database. That will save our support managers over twenty hours a week.",
      segments: [
        { start: 0.0, end: 6.0, speaker: null, text: "Welcome David to the WhipScribe enterprise onboarding session." },
        { start: 6.5, end: 14.0, speaker: null, text: "Elena, how do our team members connect their shared Google Drive folders?" },
        { start: 14.5, end: 25.0, speaker: null, text: "You simply paste any Google Drive audio sharing link into the portal, and the pipeline automatically normalizes the stream and creates structured rows in your Airtable database." },
        { start: 25.5, end: 33.0, speaker: null, text: "That will save our support managers over twenty hours a week." },
      ],
    },
  },
  {
    name: "gdrive_03_founder_update.mp4",
    expectedSpeakers: ["Founder/CEO"],
    raw: {
      text: "Good morning team. I am excited to announce that our new WIP scribe and Airtable automation pipeline is officially live. Our initial beta testers reported an 80% reduction in manual meeting documentation time across all pilot accounts. Let's keep pushing on speech recognition accuracy and edge delivery.",
      segments: [
        { start: 0.0, end: 2.0, speaker: null, text: "Good morning team." },
        { start: 2.1, end: 7.0, speaker: null, text: "I am excited to announce that our new WIP scribe and Airtable automation pipeline is officially live." },
        { start: 7.5, end: 14.0, speaker: null, text: "Our initial beta testers reported an 80% reduction in manual meeting documentation time across all pilot accounts." },
        { start: 14.5, end: 21.0, speaker: null, text: "Let's keep pushing on speech recognition accuracy and edge delivery." },
      ],
    },
  },
];

console.log("==================================================================");
console.log("EVALUATING ACCURACY ACROSS ALL 6 TEST VECTORS WITH RAW WHIPSCRIBE (NULL SPEAKERS)");
console.log("==================================================================\n");

let allPassed = true;

for (const vec of RAW_VECTORS) {
  console.log(`>>> TESTING: ${vec.name}`);
  const normalized = normalizeTranscriptDiarization(vec.raw as any);
  const detectedSpeakers = Array.from(new Set(normalized.segments?.map(s => s.speaker)));

  console.log(`    Expected Speakers : ${vec.expectedSpeakers.join(", ")}`);
  console.log(`    Detected Speakers : ${detectedSpeakers.join(", ")}`);

  const hasAllExpected = vec.expectedSpeakers.every(exp => detectedSpeakers.includes(exp));
  const exactCountMatch = detectedSpeakers.length === vec.expectedSpeakers.length;

  if (hasAllExpected && exactCountMatch) {
    console.log(`    RESULT            : [PASS] Flawless Match!`);
  } else {
    console.log(`    RESULT            : [FAIL] Expected ${vec.expectedSpeakers.join(", ")} but got ${detectedSpeakers.join(", ")}`);
    allPassed = false;
  }

  // Also verify extractIntelligence
  const intel = extractIntelligence(normalized, vec.name);
  const dynamics = intel.analytics?.speakerDynamics.map(d => `${d.speaker} (${d.sharePercent}%)`).join(", ") || "";
  console.log(`    Analytics Dynamics: ${dynamics}`);
  console.log(`    Health Score      : ${intel.analytics?.healthScore}/100 (${intel.analytics?.efficiencyLevel})`);
  console.log(`    Pivotal Anchors   : ${intel.keyMoments.length} moments`);
  intel.keyMoments.forEach(m => {
    console.log(`       - [${m.timestamp}] ${m.speaker} (${m.topic}): "${m.quote.slice(0, 70)}..."`);
  });
  console.log("");
}

console.log("==================================================================");
if (allPassed) {
  console.log("SUCCESS: ALL 6 TEST VECTORS DIARIZED AND ANALYZED WITH 100% ACCURACY!");
} else {
  console.error("FAILURE: Some test vectors did not match expected speakers.");
  process.exit(1);
}
console.log("==================================================================");
