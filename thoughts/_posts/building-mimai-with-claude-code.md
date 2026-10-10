---
title: How I Built MimAI, an AI File Assistant, With Claude Code
slug: building-mimai-with-claude-code
description: How Rapar Rubel built MimAI, an AI file assistant for Google Drive that understands Bangla, Banglish and English, with Claude Code, and what he learned.
date: 2026-10-10
tags: MimAI, Claude Code, AI product, building with AI, Google Drive, Bangladesh
tldr: MimAI is a file hub with a built-in AI assistant that finds files in the user's own Google Drive.
tldr: It understands requests in Bangla, Banglish and English.
tldr: I designed it and built it with Claude Code as my engineering partner, and it runs live on the web.
tldr: The biggest lessons — start with one painful job, describe the user not the feature, ship early, keep secrets out of the code.
faq: What is MimAI? :: MimAI is an AI file assistant and file hub designed by Rapar Rubel. It searches the user's own Google Drive and lets them find files by asking in Bangla, Banglish or English. It is live at mimai.onrender.com.
faq: Can you build a real product with Claude Code? :: Yes. Claude Code can act as an engineering partner that writes and edits code, explains errors and helps deploy. You still need a clear problem, product decisions and careful testing — that part is yours.
faq: Who built MimAI? :: MimAI was designed and built by Rapar Rubel (Rubel Miah), an independent AI expert and AI workflow builder in Dhaka, Bangladesh, using Claude Code.
---
Everyone has had this moment: you *know* the file is somewhere in your Google Drive, but you cannot remember the name, the folder or the date. You end up scrolling for ten minutes.

That small, daily frustration became [MimAI](https://mimai.onrender.com) — a file hub with an AI assistant built in. I designed it and built it with **Claude Code**. Here is what I learned.

## What problem does MimAI solve?

People do not remember file names. They remember *what the file was about* and roughly *when* they used it. So instead of searching by name, MimAI lets you ask:

- "last month er invoice ta dao"
- "the property brochure I sent last week"
- "আমার CV এর নতুন version"

The assistant searches your own Google Drive and finds the right file — in Bangla, Banglish or English. (Why three languages matter is the subject of [Why I Build AI That Speaks Banglish](../ai-that-speaks-banglish/).)

## Why did I build it with Claude Code?

I am a builder who thinks in products and businesses first. Claude Code let me work like a product lead with a tireless engineering partner: I described what the user needed, and together we wrote, tested and fixed the code.

It did not replace thinking. It made the distance between an idea and a working version much shorter, so I could spend my time on the decisions that matter — what the assistant should understand, what it should never do, and how it should feel to use.

## What were the biggest lessons?

**1. Start with one painful job.** MimAI does not try to be a whole office suite. It does one job — find my file — and tries to do it well.

**2. Describe the user, not the feature.** "A shop owner who types in Banglish on a phone and is in a hurry" leads to better decisions than "add a search box".

**3. Ship early, then improve.** A live version that real people can try teaches you more in a day than a week of planning.

**4. Keep secrets out of the code.** Keys and passwords live in the hosting platform's environment settings, never in the repository.

**5. Test with real requests.** The best test cases are the strange, messy ways people actually ask for things.

## How is MimAI deployed?

The code lives on GitHub and the app runs on Render, which redeploys automatically when I publish an update. It is a simple setup that lets a small team — or one person — ship improvements quickly and safely.

## What does this mean for other businesses?

You no longer need a large engineering team to test a useful AI idea. If you have a clear, painful job and real examples of how people ask for help, you can build a working first version quickly — and learn from real users.

That is how I approach every [AI workflow](../what-an-ai-workflow-builder-does/): small, useful, live, then better.

Want something like MimAI for your team? [Tell me about it](../../#brief).
