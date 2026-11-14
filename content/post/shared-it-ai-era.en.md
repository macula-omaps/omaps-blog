---
title: "The Upgrade of Managed IT Services: A New Option for SMB IT in the AI Era"
date: 2026-11-14T09:00:00+08:00
draft: false
tags: ["MSP", "Managed IT", "AI", "SMB"]
categories: ["AI-Native Engineering"]
---

> This post doesn't claim to settle anything. It lays out a question I've been turning over for two years: is the way SMBs buy IT about to change? My leaning is yes. This article looks at it mainly through the lens of technology development, with a quick pass at the money. Push back if I've got it wrong.

## 1. Why SMB IT Supply Is Broken

Most SMBs assemble IT like this: find someone to fix computers, hire an outsourcing firm to build business systems, and once the project ships, nobody owns it. The outsourcing problem is requirements translation — the business says "I want to know at any moment which orders might be late," and by the time it lands in the contract it has become a few screens plus a list of feature points. Acceptance passes; the business problem may still be unsolved. Traditional MSPs only cover computers, networks, and backups — they can't afford to keep people who understand the business, can plan, and will take responsibility. The result is a gap in the middle: someone manages the cables, nobody manages the systems, and nobody at all manages "where the money goes over the next three years."

## 2. The AI Development Angle: Roles Are Consolidating, Tasks Are Becoming the Unit

At this year's Baidu World Conference, Robin Li made a call: in the AI era, roles won't disappear but will consolidate into two types — Builders (who create products and services) and Sellers (who communicate, connect, and build trust). His exact words: "Roles were the organizational unit of the industrial age; in the intelligent age, it's tasks."

The implication for SMB IT is direct: **assembling an IT department out of a pile of roles is a model that's failing**. The work of sysadmins, junior developers, and on-call operations is being taken over by agents. What a company needs isn't a complete roster of roles but a collaboration network of humans plus agents organized around tasks — when a need arrives, who defines it, who reviews it, who is accountable; when the task is done, the network dissolves.

## 3. Where the Technology Is Heading: Three Layers of the Curve

This is the core of the post. How AI capability evolves over the next few years determines what IT services actually sell. My observations, in three layers.

**Layer one: writing code keeps getting cheaper.** Today AI can produce a small app you can try; next comes the shift from "generate" to "generate, self-test, and fix in one pass" — coding agents that take a requirement, run their own tests, fix their own bugs, and submit their own PRs, with multiple agents dividing up the work. The implication is blunt: revenue based on selling person-days of coding will keep depreciating. Self-service by the business isn't a fringe scenario either — Gartner found that in 2022, 41% of employees were already building tech tools outside IT's visibility, and that could reach 75% by 2027.

**Layer two: maintenance can start being partially handed to AI.** The old nightmare was "the person who understood it left, and nobody can change it." There's a hard precondition for AI to take over maintenance — it has to be able to read the code. Codebases with complete docs, clean interfaces, and full test coverage: AI can take them. A tangled mess nobody dares to touch: AI can't save that either. So a company's technical assets are being redefined: from "code" to "knowledge AI can read" — clear documentation, well-specified interfaces, automated tests, structured data. This is the same thing as "crystallizing tacit knowledge" in the intelligent-organization sense: turning experience that lives in individual heads into reusable assets. Whoever gets their codebase and data into an AI-maintainable shape first keeps their systems running through the next round of technology upgrades.

**Layer three: judgment and accountability won't get cheap.** Should this requirement be built? Can this data be used? Who is responsible when something breaks? AI can advise; it can't carry responsibility. The further the technology goes, the more human value concentrates at the two ends: defining problems on one side, bearing consequences on the other.

Putting the three layers together, I arrive at one judgment: **the value composition of IT services will migrate along the technology curve** — today it's selling labor (fixing computers, on-call coverage); next, selling platform and governance (standard foundations, code review, data governance); after that, selling data and accountability (getting a company's data into a shape AI can use, and taking responsibility on the company's behalf). Firms selling only the first layer's labor have a few years of shelf life.

One more reminder from the current state of data: SMB data today is scattered across Excel files, WeChat chat logs, and personal USB drives — no structure to speak of, let alone governance. This is the hardest ceiling on enterprise AI adoption. Getting data into an AI-usable, controllable form is a substantial amount of work — and exactly the kind of real work a managed service can do. Whoever helps a company through this step first owns the position for everything that follows.

Finally, an answer to the question every boss asks: why didn't efficiency go up after buying AI tools? There's a good line for this — you replaced the electric motor but never redesigned the factory. Anyone can buy tools. The scarce parts are the task-centered collaboration network, data governance, and the allocation of responsibility.

## 4. What This Means for SMBs: A New Option and the Math

Companies have roughly a few ways to buy IT: pure SaaS (cheap, but the moment the business has any quirk you have to live with it); hire one IT manager and stitch SaaS together (full-time on site, but one person has limited skills, and the systems stall when they take leave or quit); project outsourcing (change requests are slow and expensive, failure rates are high); traditional MSP (basic operations only). The gap sits right here.

The upgraded managed service fills exactly that gap: on top of basic operations, it adds application management, data governance, and technical planning, run as a "humans plus agents task network" — business staff use AI for the first version; the managed service provider handles review, hosting, and maintenance; infrastructure, security, and vendors are managed uniformly; the company makes the major decisions itself, with the provider supplying options and supporting analysis.

The economics come from a resource pool: one monitoring and backup platform, one set of code templates, one on-call team serving multiple clients — fixed costs get spread thin, and a pit one client falls into becomes a checklist item for all of them. Doing the capacity math honestly: a small team that can handle planning, development, operations, and security costs roughly RMB 1.0–1.6 million per year; the ceiling on depth of service means one team can serve only 3–5 clients, at roughly RMB 250,000–400,000 per client per year — mid-sized companies of a few dozen to a few hundred people with real application needs. Tiny businesses shouldn't force managed services onto themselves; the right path there is standard SaaS plus light consulting.

There's exactly one criterion for choosing it: **do you have a sustained need for applications and planning**. If yes, managed service beats maintaining headcount; if no, hiring plus SaaS is enough.

## 5. Implementation Difficulties, Briefly

Trust and compliance come first: before touching business data, define the scope; personal-information processing agreements under PIPL, data classification, and Multi-Level Protection Scheme remediation all need to be filled in — and clients should ask the provider in return about their own security certifications and liability for damages. Maintenance needs rules: code goes into a unified repository, runs under enterprise service accounts, and critical applications have a second maintainer — don't repeat the lesson of the previous generation of in-house apps, where 26% needed rework and 48% were abandoned within eighteen months. On the people side, experienced professionals over 35 have a real opportunity here, but with homework to do: develop with AI and review AI code, turn experience into explicit processes and risk checklists, and negotiate clear responsibility boundaries with the boss — this is a window of opportunity, not a job for life.

## 6. What I Haven't Figured Out Yet

- **Will the platforms swallow this layer.** DingTalk and WeCom are embedding "business staff build apps + unified platform governance" — the same thing as the standardized part of managed services, and free. I judge the standardized part is indefensible; the moat narrows to cross-system integration, industry knowledge, and taking responsibility for the client. Companies whose needs live entirely inside one platform should just use the platform.
- **How the binding model evolves.** From fixed service fees to outcome-based revenue sharing to binding with the client company's growth — the direction is right (revenue sharing must be based on data produced by the provider's own systems, otherwise there's no way to audit it), but "a service provider taking equity in a client company" has no mature precedent I've seen; it remains extrapolation.
- **No established practice at scale in China yet.** This post is my projection, not a summary of proven successes. Whether it works has to be validated by the first batch of people doing it seriously.

## 7. Closing

AI made building an application cheap. It didn't make judgment cheap, and it didn't lighten responsibility. Roles will consolidate, but a company's IT needs won't disappear — they'll shift from "maintaining a bench of roles" to "organizing a task network of humans plus agents." Whoever organizes that network for the company, gets its data and knowledge into a shape AI can use, and carries the responsibility, becomes the half an IT department that companies need in this era.

These are my current thoughts, and the unfigured-out parts outnumber the figured-out ones. Bosses who are already doing this, planning to, or wrestling with the same question — come discuss. Agreement and disagreement both beat silence.
