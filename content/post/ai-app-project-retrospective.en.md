---
title: "The Trouble with This AI Project Had Nothing to Do with AI: Concurrency, Queuing, and Three Months of Misalignment"
date: 2026-11-15T13:30:00+08:00
description: "A real case from an internal AI extraction project: two RTX 4090s running a local model, a hundred-odd files per day, yet stuck at single-digit concurrency, dragging from July to November before the misalignment surfaced. Item by item, nothing that went wrong was an AI problem—concurrency is backend engineering, capacity is system design, and the demo boundary is project management. This post walks the timeline, shows how three layers of problems stacked up, and distills two rules."
categories:
  - AI-Native Engineering
tags:
  - AI Applications
  - Case Study
  - Engineering Management
  - Requirements Analysis
  - AI Coding
toc: true
---

> This is a case study of an internal AI tool project. Names, the company, and the business scenario are anonymized; only hardware specs and usage scale are kept—because every judgment in this case only becomes clear through those numbers.

The conclusion first: there was no act of God in this case; at every step, a cheaper path existed. Shallow technical judgment, an unmanaged demo boundary, and a project assigned by habit rather than skill—three layers of problems stacked up over three months and finally exploded in a single meeting. Let's take it apart. The title is the thesis of this post: **taken item by item, nothing that stalled this project was an AI problem**—concurrency management is backend engineering, capacity estimation is system design, the demo boundary is project management, and the assignment convention is an organizational issue.

## 1. Background and Timeline

The scenario required high confidentiality, so the model had to run on-premise. The team used two RTX 4090s running a 26B open-source model for document extraction, delivered as a demo in July, and the results basically met the requirements.

The problems came in the following three months. The user base grew from a small group to multiple branch offices, with daily volume reaching the low hundreds, while measured peak concurrency stayed at single digits—with just two people using it at the same time, requests started queuing, slowing down, and erroring out. The business side complained in the group chat for over a month, and in early October explicitly asked for a capacity expansion assessment; the answer was that there was no time to evaluate it for now. By the time the confrontation meeting happened in November, the gap in how the two sides understood the project's status finally surfaced: the developer believed this was only a demo awaiting formal project approval, never promised for multi-user use; the business believed this was a live system already supporting daily work.

A few details from the meeting are worth recording. The developer's first reaction to the concurrency problem was to introduce caching and rate-limiting components with a full queuing mechanism, on a schedule measured in weeks; the first reaction to the expansion request was process—the project wasn't formally approved, so this could only count as emergency support. The business lead, on the same day, offered a manual scheduling plan: stagger the large tasks into time slots, two people in parallel, good enough.

## 2. Five Key Points Along the Timeline

Break the three months apart, and every point had a cheaper way out.

### 1. "Slow" Was Blamed Directly on the Hardware

Once the system got slow, the conclusion was that the hardware was underpowered, leaving two paths: buy more hardware, or sign an NDA and move to the cloud. One path costs money, the other costs time—and both happened to be the most expensive options. But nobody went back and asked: what exactly was slow—model inference, multiple people competing for the same card, or simply no queuing of tasks at all?

### 2. Nobody Ran the Capacity Numbers

Put the numbers from the business side together, and the conclusion was already there:

| Key figure | Scale | Source |
| --- | --- | --- |
| Daily volume | Low hundreds | Provided by the business side |
| Peak concurrency | Single digits | Measured |
| Per-item extraction time | Minutes | Model inference |
| Hardware | Two RTX 4090s + a 26B local model | Fixed assets |

At low hundreds of items a day and minutes per item, the two cards had far more daily capacity than the workload required. What was missing was never compute—it was just a mechanism to queue instantaneous requests. This arithmetic is elementary school level, yet in three months nobody ran it.

### 3. The Most Important Question Never Got Asked

In the meeting, the business lead made it clear that the scenario was essentially batch processing: after submitting a batch of files, waiting for a while was perfectly acceptable, and he could do other things meanwhile. The moment that was said, the problem changed nature entirely—pure batch processing, no real-time interaction needed. A directory-scanning queue that processes files in order would solve it; even Redis was unnecessary.

The most critical piece of information on the requirements side was whether users could wait. In three months, nobody asked. Without that one question, everyone was stuck circling the two expensive paths: buying hardware or moving to the cloud.

### 4. The Heaviest Solution Got Quoted

Asked how to fix the queuing, the first reaction was to introduce caching, rate limiting, and a full queue service, on a schedule measured in weeks. After taking over and reading the code, what was actually needed was a directory scan plus a task-state table—landed in a day or two.

Here is a lesson worth writing into team norms: **people without hands-on experience in a problem domain always quote the most conservative schedule**, because what they estimate is not "how hard is this problem" but "can I cover the worst case". Not knowing concurrency isn't scary; what's scary is not knowing that lightweight solutions exist, and reaching for the heaviest pattern you've heard of.

### 5. The Assessment Request Got Dodged

In early October, the business side asked for a capacity assessment; the answer was that there was no time to evaluate it for now. How many days does an expansion assessment take? Probably no more than three. Declining saved three days and cost the business side's trust in IT's judgment—from that moment on, every explanation sounded like an excuse. The business side's heated attitude in the meeting was powder keg laid back then.

## 3. Three Layers Behind the Case

String the five points together and they point to three deeper problems.

### 1. Misaligned Experience: Application-Layer Experience Mistaken for Engineering Experience

This colleague had indeed worked on multiple AI projects, but the "AI experience" from those projects was essentially calling APIs, writing prompts, and building UI—AI as a feature inside a product. Every problem this case exposed, however, was not an AI problem: concurrency management is backend engineering, capacity estimation is system design, user research is requirements analysis, and the demo boundary is project management.

The hard parts of an AI project are seventy percent traditional software engineering and thirty percent the model. His experience structure was exactly inverted—all of the thirty percent, none of the seventy. The label "worked on multiple AI projects" masked the misalignment.

### 2. Misaligned Boundaries: Nobody Managed the Demo's Shelf Life

At demo delivery, the developer's script was: validate feasibility, then get formal project approval, then buy hardware, then turn it into a real project. The business's script was: if the tool works, use it; when more people come, add them. Nothing aligned the two scripts: on the day the user base grew, nobody raised the alarm—this is a demo, concurrency caps at single digits, it will break, we need project approval; and nobody periodically checked how far the demo had spread. For three months, "not yet approved" was both the developer's shield and a blind spot shared by everyone.

There should be a clear management boundary between a demo and a production system: agree on the use and limits at delivery, and going over the limit must trigger an escalation. Who should guard that boundary? The developer's direct manager, the business-side liaison, the approval process itself—all share the blame. Punishing one person's communication failure afterwards doesn't prevent the next occurrence.

### 3. Misaligned Roles: Projects Assigned by Habit, Not by Skill

Why would a frontend engineer single-handedly take on a project involving concurrency, queuing, and compute scheduling? Because of an organizational convention: stateless, no-backend-needed tool apps always went to him. That convention was reasonable in past scenarios, but AI application projects are naturally backend-heavy—queuing, scheduling, reliability, capacity, all systems engineering.

The organization assigned by inertia, handing the scenario that most requires systems engineering to the person with the least of that capability, and then expected correct judgment. That's unreasonable. Half of the five problems above were doomed at this layer.

## 4. One Irony and Two Rules

At the end of the case, the sharpest irony surfaces: this was an AI project, yet the people building it never once used AI to help solve their own problem. Workload estimation was a gut-feel schedule measured in weeks; when hitting an unfamiliar concurrency problem, the first reaction was to find backend support and follow a schedule, rather than first letting AI analyze the code structure and bottlenecks. The person who took over later used an AI coding assistant for a full code analysis, structural refactoring, and solution validation—in days.

**Building products with AI is not the same as working with AI.** In 2026, "I don't know backend" is no longer a wall you can't cross—the wall was built by never looking toward AI.

Two rules distilled from this case, to be applied directly to future AI projects:

1) **Ask for four numbers at kickoff**: user count, peak concurrency, per-item time, daily volume. Once those four numbers are on the table, "buy hardware or build a queue" needs no debate—arithmetic gives the answer.

2) **Run an AI validation before quoting any schedule over two weeks**: for any estimate beyond two weeks, first do an AI-assisted code analysis and solution comparison, confirm that the heaviest solution is truly the necessary one, then quote the schedule. In the AI coding era, estimating unfamiliar domains from memory and hearsay amounts to a dereliction of work.

## Further Reading (This Site)

- [Enterprise AI Adoption: Organizational Context, Internal FDEs, and Scenario Gates](/en/post/enterprise-ai-landing/)
- [AI-Native Engineering: Artifact Chains, Gates, and Metrics](/en/post/ai-native-sdlc-gates/)
