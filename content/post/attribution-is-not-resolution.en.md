---
title: "Attribution Is Not Resolution: AI Diagnosis, Organizational Context, and a Low-Cost Bypass"
date: 2026-11-20T10:30:00+08:00
description: "Two rounds of handling one branch-office access incident: manual troubleshooting reached the correct root cause months ago and stopped there; AI converged on the right category in a single question, yet every remedy it offered pointed outward. Closure came through a VPN back to the headquarters egress and an on-site test that pinned down login-only verification. The breakpoint is not attribution but what comes after it—and the input to that stretch is organizational context."
categories:
  - AI-Native Engineering
tags:
  - Case Study
  - Enterprise AI
  - Context Engineering
  - Network Troubleshooting
toc: true
---

> This is a retrospective of a real incident-handling process. Names, the company, the platform, and locations are all anonymized; only two numbers are kept—the number of steps in the checklist and the time to closure—because the judgments below rest on them.

The conclusion first: in the diagnosis phase of this incident, the best performer was AI—one question narrowed the candidate causes down to the right category. Human troubleshooting had reached the same conclusion months earlier, yet stopped right there once the attribution was done. What actually pushed the issue to closure were two things AI could not do: knowing what the company itself had, and going on-site to pin down the mechanism that "verification happens only at PC login." **Attribution is not resolution**—the breakpoint sits between root cause and workaround, and the input to that stretch is not reasoning power but organizational context.

## 1. The Incident and Two Rounds of Handling

The background is simple. A colleague at one branch office could not reach an external collaboration platform from her office PC; her phone was unaffected—fine on both cellular data and the office Wi-Fi—and PCs at all other branches worked normally. With the platform unreachable, the branch lost a link in its daily interaction with the outside. The issue went through two rounds of handling.

The first round was manual troubleshooting by an IT support colleague. The effort was real, and the conclusion was correct: the service provider restricts access by egress IP; the branch's public egress is a dynamic IP and not on the allowlist, while branches with static egresses were unaffected. The business side also contacted the provider, who added the then-current egress IP to the allowlist—still no luck. A dynamic egress changes its address, and the allowlist entry goes stale with it. At that point the root cause was already crystal clear.

Then what? Then nothing. No escalation, no workaround, no documented conclusion—just a reply saying "the provider restricts IPs." On paper the issue counted as "handled," and it sat there for months.

The second round was taken over by another colleague, with a six-step path laid out: 1) remote into the faulty PC and look at the scene; 2) hand the symptoms to a large-model chat tool for diagnosis; 3) compare against a colleague on the same floor running the same software to narrow the scope; 4) if the comparison machine was fine, try a reinstall; 5) if a dynamic egress breaking the allowlist was confirmed, verify by VPN back to the headquarters egress; 6) if all that failed, evaluate buying a wireless data plan as a fallback.

Closure took only three of those steps: AI diagnosis converged on the "provider restricts by egress IP" category; VPN back to the headquarters egress, and login succeeded; then a quick extra test—after logging in, disconnect the VPN and the session keeps working. Two hours later, the colleague reported the problem solved.

| Stage | Action | Finding | Outcome |
| --- | --- | --- | --- |
| First round | Manual troubleshooting | Egress IP not on the provider's allowlist; local egress is dynamic | Attribution correct, then shelved |
| Second round | Remote on-site check | Symptoms consistent with the first round | Confirmed |
| Second round | AI diagnosis | Provider restricts by egress IP, among the candidate categories | Converged |
| Second round | VPN to headquarters egress | Login succeeded | Hit |
| Extra test | Disconnect VPN after login | Session not subject to the egress check | Mechanism confirmed |
| Fallback | Wireless data plan | Not used | Contingency |

The value of the six-step list lies not in executing every step but in its completeness: it includes what comes after attribution—narrowing the scope, verifying a workaround, holding a fallback. That was exactly the missing second half in the first round.

## 2. The Root Cause Was There All Along; It Stopped at the Root Cause

### 1. The attribution was right; what was missing came after it

To be fair: the first-round attribution was completely correct. The diagnosis "dynamic IP not on the allowlist" would later appear among the AI's five candidate categories. What it lacked was not "finding the cause" but the next step. Attribution answers "why"; a workaround answers "how to get through under existing constraints." Starting from "dynamic egress breaks the allowlist," there are at least three roads—1) have the provider authenticate by account instead of IP; 2) provision a static egress for the branch; 3) route through a static egress we control. Choosing among them depends on three pieces of information, all held inside the company: whether there is an existing headquarters static egress, whether a VPN exists, and at which point the provider runs its check. None of that is in the symptoms, and none of it is in any general knowledge base.

"Shelved for months" now has a more accurate explanation: not an attitude problem, but a checklist with no chapter called "after attribution." Once the root cause was in hand, the issue counted as "processed" by the process. That gap sits much deeper than diligence—and is far easier to fix.

### 2. Five candidates from AI, and the one entry that was missing

AI's performance in round two deserves its own note. Feed the model a few fragments—"office PC fails, phone works, other branches fine"—and it first rules a direction: a provider-side restriction, not an account problem. Then it lists five candidate causes, and the actual one—the egress IP not on the provider's allowlist—is among them, flagged as "a very common pitfall." A conclusion category that took manual troubleshooting months, AI converged on in a single question.

But that round of diagnosis also exposed a second layer of the context problem: the symptom report never said under which network "the phone works." The AI could only guess—"most likely a PC issue; whether the phone still works on office Wi-Fi needs confirmation"—and scheduled a cross-test just to recover that one fact. The fact later proved decisive: the phone was fine on both cellular and office Wi-Fi, meaning the check did not follow the egress but applied only at PC-client login. The more complete the phenomena you feed an AI, the sharper it converges; feed it an incomplete picture, and its diagnosis stands on guesses. Fill in the phenomena first—only then does feeding internal topology even come into play.

Lay out the remedies it offered, though, and they all point outward: open the local firewall, ask the provider to extend the allowlist, change DNS, switch lines, file a ticket. At the end of the list sat one contingency—tether the PC to the phone—which is the same class of move as the VPN back to headquarters: change the egress path. Between the two sits a single fact no AI could know: the company has a headquarters static egress, and a working VPN. Without that fact in the input, no amount of reasoning produces the cheapest option.

**Models are homogeneous; context is proprietary.** AI can enumerate an industry's generic troubleshooting checklist, but an organization's internal topology—where the static egress is, where the VPN reaches, at which point the check happens—is not in its input. What's missing is not reasoning; it's that nobody fed it.

### 3. AI gives you "usually"; the site gives you "exactly"

AI's inference stopped at "the security fence usually checks the office-network egress"—a correct prior, and only a prior. The on-site test turned "usually" into "exactly": the egress-IP check happens only at PC login—the phone side is never checked, on either cellular or office Wi-Fi—and after login, disconnecting the VPN leaves the session intact and fully functional.

What makes this test valuable is that it turns "low-cost" from an adjective into a conclusion: the cost of the workaround is not running a VPN all day, just wearing one for the login moment. Had the check applied to session keep-alive, the cost and viability of the VPN plan would be a different story. Mechanism details like this cannot be reasoned out from a desk; they can only be measured on site. Looking at the scene remotely is not ceremony—it is the only move that turns a prior into a certain conclusion.

## 3. The Two Rounds, Side by Side

| Dimension | Round one | Round two |
| --- | --- | --- |
| Attribution | Correct, by manual troubleshooting | Correct and faster—AI converged in one question |
| Where it stopped | Stopped when attribution was done | Pushed on to the workaround and a mechanism test |
| Where the fix came from | Waiting for the other side (re-adding allowlist entries each time the egress changed) | Using what we already had (headquarters static egress + VPN) |
| Understanding of the mechanism | Allowlisted and still failing | Check only at PC login, phone never checked; VPN droppable after login |
| Outcome | Shelved for months | Closed in two hours |

The difference is not ability; it is two things: 1) whether someone pushes the root cause onward into an executable plan, and 2) whether the organization's internal context gets used. One more thing has to be said plainly: **swapping in a different person is not the fix.** Same symptoms, same root cause—bring in another person without that internal topology and that checklist, and the outcome may not differ. What replicates is the checklist and the context, not a particular individual.

## 4. What Can Be Distilled: the Checklist and the Context

### 1. Write "after attribution" into the checklist

The six-step list is worth institutionalizing, but the point is not those six steps themselves—it is the missing second half they restore: after attribution, narrow the scope, verify a workaround, hold a fallback. A checklist that ends at "locate the cause" makes attribution the terminal state by default. The months of shelving were not anyone's laziness; the checklist was missing a chapter.

### 2. Turn internal topology into context AI can reach

The minimal sample this case offers: one internal fact—the company has a headquarters static egress and a working VPN—decided whether the cheapest option appeared in AI's list of remedies. Today such facts live in the heads of a few engineers; those who know pick the move in one step, those who don't can only search outward. To make AI genuinely usable in scenarios like this, the move is not a stronger model, but turning facts like "which egresses the company has, which branches the VPN covers, which clients the external platform checks and how" into retrievable context: feed the phenomena in full, hand attribution to the AI to converge, pick the workaround from internal context, and confirm the mechanism with an on-site test.

### 3. The missing fact belonged in a knowledge base

Looking back at AI's list of remedies, what was missing was a single fact: the company has a headquarters static egress, and the VPN works. That fact is no tribal secret—it always had a proper home. When the network and infrastructure were built, the egress plan belonged in the build manual; when the VPN was delivered, its configuration and coverage belonged in the operations log. Had those manuals and logs been sitting in a knowledge base all along, and had this question carried that one line of background, the list of five remedies would most likely have grown a sixth: "route through the headquarters egress." Remember, the model came up with "tether the PC to the phone"—the same class of move—all by itself; all it lacked was that one fact.

That is what "a knowledge base is built by daily accumulation" means: not back-filling documents after an outage, but writing the manual on the day the infrastructure is finished and logging every change as it happens—accumulated day by day, drawn on in the moment. The counterexample is in this very case: that screenshot from months earlier was a real record that somebody had seen, yet it never became retrievable knowledge, and the next person started from zero all the same. **The opposite of a knowledge base is not the absence of records; it is records that exist and knowledge that doesn't.**

Attribution is not resolution. The last stretch past the breakpoint depends on what the organization itself knows, and on whether it is willing to take one more step. The first checklist item can start today—add "after attribution" to your own troubleshooting list. Whether you agree or not, I'd like to hear it.
