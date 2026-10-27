/**
 * Seed script — inserts sample data into MongoDB.
 *
 * Run with:
 *   npx tsx scripts/seed.ts
 *
 * Or add to package.json:
 *   "seed": "tsx scripts/seed.ts"
 *   then: npm run seed
 *
 * Safe to run multiple times — it clears each collection first.
 */
import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]); // Forces Node to use Google DNS

// ... rest of your imports (dotenv, mongoose, models, etc.)
import mongoose from "mongoose";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import {
  Wish,
  Congratulation,
  Memory,
  Moment,
  PromiseModel,
  Sorry,
  ThankYou,
  Video,
} from "../lib/models";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in .env.local");
  process.exit(1);
}

// ─────────────────────────────────────────────
// Sample data — 3 entries per category
// ─────────────────────────────────────────────

const wishes = [
  {
    emoji: "💙",
    description:
      "May this year bring you the kind of peace that doesn't need to be explained — the quiet kind that settles in your chest and stays.",
    order: 0,
  },
  {
    emoji: "✨",
    description:
      "I hope you laugh so hard this year that your cheeks hurt, and that every one of those laughs is a memory you keep.",
    order: 1,
  },
  {
    emoji: "🌙",
    description:
      "Wishing you soft nights, slow mornings, and the kind of rest that actually feels like rest. You deserve all of it.",
    order: 2,
  },
];

const congratulations = [
  {
    media:
      "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
    mediaType: "image" as const,
    heading: "You did it. Again.",
    description:
      "Every year you somehow become more yourself, and every year I'm more proud of the person you're becoming. This one is no different.",
    order: 0,
  },
  {
    media:
      "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
    mediaType: "image" as const,
    heading: "The year you grew the most",
    description:
      "You handled things this year that would have broken most people, and you did it quietly, gracefully, with your usual softness intact.",
    order: 1,
  },
  {
    media:
      "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
    mediaType: "image" as const,
    heading: "And this is only the start",
    description:
      "The best version of you is still ahead. I can feel it. Twenty-two looks good on you — but twenty-three is going to look even better.",
    order: 2,
  },
];

const memories = [
  {
    media:
      "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
    mediaType: "image" as const,
    description:
      "That night we talked until 3am and I realised you were the person I'd been waiting to meet my whole life.",
    order: 0,
  },
  {
    media:
      "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
    mediaType: "image" as const,
    description:
      "The day you laughed so hard you cried over something that wasn't even that funny. I still think about it.",
    order: 1,
  },
  {
    media:
      "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
    mediaType: "image" as const,
    description:
      "Every small moment where you didn't realise I was watching you and thinking: how did I get this lucky.",
    order: 2,
  },
];

const moments = [
  {
    media:
      "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
    mediaType: "image" as const,
    heading: "The first hello",
    note:
      "You said hi like it was nothing. It was everything. I still remember exactly what you were wearing.",
    order: 0,
  },
  {
    media:
      "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
    mediaType: "image" as const,
    heading: "The rainy evening",
    note:
      "We got drenched and you laughed the whole way home. That's the moment I knew.",
    order: 1,
  },
  {
    media:
      "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
    mediaType: "image" as const,
    heading: "The quiet morning",
    note:
      "You made tea without saying anything and handed it to me. That's love, I think.",
    order: 2,
  },
];

const promises = [
  {
    emoji: "💙",
    heading: "I promise to listen",
    detail:
      "Not just hear you — actually listen. Even when you're telling me the same story for the third time, because it matters to you, so it matters to me.",
    order: 0,
  },
  {
    emoji: "🌿",
    heading: "I promise to grow with you",
    detail:
      "Not ahead of you, not behind you — beside you. Wherever this takes us, we go together or not at all.",
    order: 1,
  },
  {
    emoji: "⭐",
    heading: "I promise to choose you",
    detail:
      "On the good days and the ugly ones. Every single time. Even when it's hard. Especially when it's hard.",
    order: 2,
  },
];

const sorryNotes = [
  {
    note:
      "I'm sorry for the times I got quiet when I should have spoken up. For the times I let my own head get in the way of being there for you.",
    order: 0,
  },
  {
    note:
      "I'm sorry for every moment you needed me and I wasn't fully present. You deserve someone who shows up completely, and I'm still learning how to be that.",
    order: 1,
  },
  {
    note:
      "I'm sorry for the small things I didn't notice, and the big things I didn't say. You matter more than I know how to show sometimes. I'm working on it.",
    order: 2,
  },
];

const thankYouNotes = [
  {
    emoji: "💙",
    notes:
      "Thank you for being the person who makes ordinary days feel like they have meaning. Thank you for your patience, your softness, your ridiculous sense of humour. Thank you for being exactly who you are.",
    order: 0,
  },
  {
    emoji: "🌙",
    notes:
      "Thank you for the late-night conversations, the early-morning texts, the songs you send me at random. Thank you for every little thing you do that you think goes unnoticed — I notice all of it.",
    order: 1,
  },
  {
    emoji: "✨",
    notes:
      "Thank you for choosing me, over and over, even on the days I made it hard. Happy birthday, Umer. Here's to twenty-two being the year everything feels a little lighter.",
    order: 2,
  },
];

const video = {
  media:
    "https://res.cloudinary.com/demo/video/upload/v1692307623/sample-video.mp4",
  description:
    "I recorded this because I wanted you to hear it in my voice, not just read it. Press play whenever you're ready. 💙",
};

// ─────────────────────────────────────────────
// Run
// ─────────────────────────────────────────────

async function seed() {
  console.log("🌱 Connecting to MongoDB…");
  await mongoose.connect(MONGODB_URI as string, {
    serverSelectionTimeoutMS: 15000,
  });
  console.log("✅ Connected\n");

  console.log("🧹 Clearing existing data…");
  await Promise.all([
    Wish.deleteMany({}),
    Congratulation.deleteMany({}),
    Memory.deleteMany({}),
    Moment.deleteMany({}),
    PromiseModel.deleteMany({}),
    Sorry.deleteMany({}),
    ThankYou.deleteMany({}),
    Video.deleteMany({}),
  ]);
  console.log("✅ Cleared\n");

  console.log("🌱 Inserting sample data…");
  await Wish.insertMany(wishes);
  console.log(`   ✓ ${wishes.length} wishes`);

  await Congratulation.insertMany(congratulations);
  console.log(`   ✓ ${congratulations.length} congratulations`);

  await Memory.insertMany(memories);
  console.log(`   ✓ ${memories.length} memories`);

  await Moment.insertMany(moments);
  console.log(`   ✓ ${moments.length} moments`);

  await PromiseModel.insertMany(promises);
  console.log(`   ✓ ${promises.length} promises`);

  await Sorry.insertMany(sorryNotes);
  console.log(`   ✓ ${sorryNotes.length} sorry notes`);

  await ThankYou.insertMany(thankYouNotes);
  console.log(`   ✓ ${thankYouNotes.length} thank-you notes`);

  await Video.create(video);
  console.log(`   ✓ 1 video\n`);

  console.log("🎉 Seed complete!");
  console.log("");
  console.log("Next steps:");
  console.log("  1. Refresh /admin — you should see counts on each tab");
  console.log("  2. Refresh / — go through the full experience");
  console.log("  3. Replace the demo Cloudinary URLs with your own uploads via /admin");
  console.log("");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});