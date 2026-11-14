---
title: "AI-Native Engineering: Artifact Chains, Gates, and Metrics"
date: 2026-11-12T15:30:00+08:00
description: "Installing AI coding tools does not mean you have changed your development process. This post covers where AI-native SDLC actually gets stuck: the artifact chain, constraints vs. assumptions, three-valued gates, three-layer metrics, and the four failure modes that always show up."
categories:
  - AI-Native Engineering
tags:
  - AI-Native
  - SDLC
  - Gate Design
  - Engineering Productivity
  - Metrics
toc: true
---

> This is what we learned after getting an AI-native development process running end to end: the artifact chain, the distinction between constraints and assumptions, three-valued gates, three-layer metrics, and four failure modes you will inevitably hit. Installing the tools is year one; hardening the process is the actual transformation.

Last year we rolled AI coding tools into our development team. Three months later we did a delivery review, and the numbers were ugly: **plenty of tool usage, no faster delivery**. The cause was not the models — it was that we treated them as "faster typewriters" while the process itself never moved an inch.

Then we sampled our ticket backlog and found the real problem. Among newly created tickets, **genuinely new feature development accounted for only 16%**: 38% were unclear requirements, 25% defect fixes, 12% configuration changes, and 10% data operations. At the same time, 46% of tickets had empty descriptions, and story-point completion was 0%.

These numbers settle the question: **the bottleneck is not "can AI write code" — it's that more than 80% of the work never goes through new feature development at all**. If you want AI to speed things up, you first have to turn that work into handoff-ready, verifiable inputs. Otherwise you are just turning "unclear requirements" into "unreadable code" faster.

What follows is what we came up with after taking Anthropic's AI-native SDLC playbook apart and rewriting it against our own legacy systems. It is not a best-practices checklist; it is the shape left behind after stepping on the rakes.

## Three Things to Get Straight First

**1. AI-native is not bolting a code generator onto the old process.**

The traditional SDLC is a straight line: plan → design → build → test → deploy → maintain, with each stage handed forward when done. AI-native keeps those six stages but turns the line into a loop with backflow, and brings AI into every stage.

None of the control objectives go away — accountability, approvals, isolation, audit, rollback all remain. What changes is that control **no longer depends only on meetings and habits**; as much as possible it lands on deterministic things: versioned files, permissions, Hooks, CI checks.

**2. The next stage reads the previous stage's artifacts, not "the previous chat."**

Sessions have a shelf life; artifacts are assets. Anything that lives only as "we discussed this last time" does not exist for the next stage unless it is in a file.

**3. Control must migrate from "a senior colleague glances at it" to the machine.**

When humans make the changes, a glance works — the volume is small and the context lives in someone's head. Once AI amplifies the volume of change, the glance becomes both the bottleneck and a reliable way to miss things. You cannot guard nonlinear output with a linear human checkpoint.

## The Paradigm in Brief: Baselines, Sandboxes, Gatekeepers

Three sentences:

1. **Consensus is solidified into executable baselines** — ADRs plus invariants (JSON Schema / OpenAPI / JSON Logic), read-only, versioned, the single source of truth.
2. **Exploration is isolated in private sandboxes** — derived from a specified baseline version; sandbox output is only a candidate and never enters the baseline automatically; drift beyond a threshold is a violation.
3. **Hallucinations are caught by an independent gatekeeper** — the Gatekeeper is physically separated from the Builder and consumes **only "the full baseline + this change set"; it never reads sandbox chat history**.

Item 3 is the one most often done wrong. Asking the model to "double-check what you just wrote" in the same session is the same as not checking: it sees its own reasoning, not the facts. The gatekeeper must be a separate session whose input is exactly two things — one more is too many.

The accompanying red lines (reviewers can reject outright): no sharing a single session as a collaboration space; no committing baseline changes while bypassing the gatekeeper; no letting the gatekeeper read sandbox chat history or requirement stories; no letting ordinary developers edit `invariants/` or `contracts/` directly — everything goes through change-proposal merges; no letting sandboxes drift beyond limits for long. Every exemption requires its own ADR stating the reason, validity period, and responsible owner, permanently on record.

## The Six-Stage Artifact Chain, and Three Real Gaps

```
intent.md → spec.md → plan.md → diff + tests → PR + review → incident → new intent.md
```

| Artifact | Answers what | Most commonly missing part |
|---|---|---|
| `intent.md` | Why do this | Exclusions, open questions |
| `spec.md` | What it should look like | Constraints and assumptions not separated |
| `plan.md` | Which files, what order, how to prove it | **Missing entirely** |
| `diff + tests` | What actually changed, how it was verified | — |
| `PR + review` | Conclusion and evidence | Deviation summary |
| `incident` | What happened in production | No backflow into a new intent |

### Gap 1: `plan.md`

In traditional development, the implementation approach often lives in an engineer's head or in ticket comments. By the time a reviewer sees the full plan, they are usually facing a giant diff, and **the cost of changing direction is so high nobody raises it**.

AI makes "just write it first" extremely cheap, so big-diff reviews went from occasional to routine, and a few senior engineers cannot keep up. The antidote is plan mode: the Agent gets read-only repo access, produces a plan first, and only starts implementing after a human approves it.

A plan must be specific enough that "an engineer who has never seen the project could execute from it alone": which files to change (**including files explicitly marked "leave untouched"**), order and dependencies, the most dangerous steps and their blast radius, how completion will be proven, alternatives that were rejected and why, and how to write back when reality deviates. "Most dangerous steps" and "rejected alternatives" are the two most often skipped sections — and also the two with the most information value at review time.

### Gap 2: "Open Questions" in `intent.md`

AI's greatest talent is confidently inventing consensus that doesn't exist. Listing guesses explicitly is the cheapest way to force hallucinations into the open. An intent needs at least five sections: the problem, the desired outcome, the scope of impact, constraints and exclusions, and open questions. The last section carries the most leverage.

### Gap 3: Constraints and Assumptions Must Be Written Separately

Traditional specs dump requirements into one pile, and AI cannot tell which are nailed down and which it may decide itself. There is exactly one test: **can a test case determine pass/fail?**

- Yes → **Constraint**: goes into the invariant baseline, checked automatically, changes require a change proposal approved by the architecture group.
- No → **Assumption**: the implementer may adjust it, but must document it in the deviation log.

Our invariant system solved the "constraint" half long ago, but **left no room for "assumptions"**. The consequence: when AI hits a blank spot in the spec it has only two options — stop and ask (interrupting the flow) or make something up (hallucination escape). Giving assumptions an explicit home tells it "you may decide these, but leave a record" — speed survives, and so does the audit trail.

One hard rule to go with it: **deviation is allowed; not recording a deviation is not**. Even if the deviation section of `plan.md` is empty, write "no deviations"; PR descriptions must include a deviation summary. Track quarterly the ratio of "diff deviated from plan without being recorded" — above 20% means the plan itself was written too loosely.

## Four Layers of Knowledge Carriers: Don't Mistake "Advice" for "Guarantees"

Organizational knowledge must be layered by control strength; don't mix them:

| Layer | Carrier | What it holds | Strength |
|---|---|---|---|
| 1 | `CLAUDE.md` / `AGENTS.md` | Build/test commands, conventions, architecture boundaries, mistakes AI keeps making | Advisory |
| 2 | Skills / prompt packs | Processes and policies reused across tasks | Advisory |
| 3 | Hooks | Allow / ask / block that must run before or after actions | Deterministic |
| 4 | CI / tests | Invariant tests, contract diffs, drift scores | Deterministic |

One-sentence principle: **any rule that can be written as a script must not be written as a prompt.**

However good the gatekeeper's prompt is, it is still layer 2 — it raises the **probability** of policy compliance, it doesn't guarantee it. Layers 3 and 4 are the real backstop. So every time the gatekeeper catches a systematic rule, ask one question: can this become a CI check? If yes, get it out of the prompt.

`CLAUDE.md` uses a four-section structure: Commands, Conventions, Architecture, Known mistakes. The maintenance discipline matters more than the content: keep it short (it gets read every session), prune down from the initialization output rather than stacking up from blank, **write a corrective rule the second time the same mistake appears**, and clean it out once a quarter.

The last rule is the most ignored: a `CLAUDE.md` that hasn't been updated in three months turns from "helpful" into "reliably generating errors" — stale instructions burn context and point in the wrong direction every time.

## Gates: Three-Valued Verdicts, Fail Closed

Most teams' gatekeepers have only two verdicts: pass, reject. That misses the most dangerous case — **insufficient evidence**.

| Verdict | Meaning | Action |
|---|---|---|
| `PASS` | Backed by a specific invariant ID, and counterexample tests pass | Allow through |
| `BLOCKED` | Violates an invariant (must cite the INV ID) or drift exceeds limits | Reject |
| `UNKNOWN` | Not enough information to decide | **Do not allow through**, escalate to a human |

The principle behind `UNKNOWN` is **fail closed**: a high-risk action must not pass just because "the verification system is temporarily down." Meanwhile, `block` must return an actionable correction path, not a bare rejection; `ask` must name a specific person, not a role — assigning to a role means nobody is responsible.

Three more that are easy to overlook:

- **The executor and the auditor must be separate.** The same model instance cannot be both the executor and the final auditor.
- **Gates need bidirectional testing.** Before each Hook ships, two test cases: one genuinely dangerous action must be blocked, and one normal action must pass. A Hook that blocks everything isn't secure — it's unusable.
- **Credentials only as placeholders.** Outbound requests get real auth headers injected by a trusted proxy based on "domain + path + method"; credentials never enter snapshots. Putting real tokens into environment variables is the most common and most dangerous shortcut — an Agent can run `env`, read `/proc`, and hit logs.

Autonomy is tiered by environment: dev environments can be highly autonomous (auto-edit, auto-run tests), staging keeps partial approvals, and in production the Agent only **prepares** releases while a human authorizes them.

## Metrics: Three Inseparable Layers, the Primary-Key Chain Must Close

| Layer | Answers what | Consequence of looking at it alone |
|---|---|---|
| L1 AI effectiveness | Is AI actually in the process | Self-congratulation |
| L2 Engineering quality | Can quality risk be held in check | Afraid to use it |
| L3 Value delivery | Is the business faster and more stable | Can't explain why |

Together the three layers form a complete evidence chain. In L2, watch **escaped defects** (found after merge or in production) and **production incidents the gate should have caught but didn't** — that is the ultimate test of gate effectiveness, worth far more than pass rates.

Below that is the attribution primary-key chain:

```
Session → Commit → Change → Workitem
```

Every AI session must be traceable to the commit it produced, every commit to its change, every change to its work item. Break this chain and you can never say whether a speedup came from AI, nor trace a defect back to the session that introduced it.

Enforcement is entirely CI-driven: PRs must carry a workitem ID, commit messages get a session ID appended automatically (by the CLI, not by memory), and PRs record the baseline version. **Fields that rely on self-discipline drop below a 30% fill rate within three months.**

## Four Failure Modes You Will Inevitably Hit

**1. The process idles.** Sandboxes exist, proposals get filed, the gatekeeper runs — but everyone privately knows it's theater, and real decisions still happen verbally offline. The root cause is not uncooperative people: the gatekeeper validates **the invariants that were written down**, and most real constraints never made it into the baseline — so everything passes validation. The signal is unmistakable: **gatekeeper rejection rate persistently below 5%**. The problem isn't the gatekeeper; the baseline is too thin. Fix the baseline first, then talk process.

**2. The gatekeeper hallucinates.** It confidently lists a "conflict report" that is pure fabrication on inspection. Countermeasures: every conflict report must be traceable to specific invariant IDs — output without IDs is invalid by definition; structural conflicts (Schema incompatibility, missing fields) go to deterministic scripts, not the LLM's judgment; run important proposals twice, and if the conclusions disagree, bring in a human.

**3. Uncertainty gates pile up without end.** A pile of requirements stuck at "waiting for rule confirmation," developers sit idle, and eventually they bypass the process and just write the code. Every gate must have an owner and a deadline (say, 5 business days), auto-escalate when overdue, and publish a monthly "backlog leaderboard." A gate with no decision-maker will eventually be bypassed.

**4. Sandboxes become long-lived branches.** Open for two months without merging, local rules drift light-years from the baseline, and the eventual merge is a disaster. Compute drift scores with a script, force a prompt past the threshold, force-archive long-stale sandboxes. Don't rely on self-discipline.

One more move that isn't technical: **before the pilot starts, publicly commit in writing to "allowing a 20% slowdown,"** and communicate it to the business side. Say it after the schedule slips and nobody believes you — the process collapses that day.

## Rollout Order: By Dependency, Not by Calendar

1. **Diagnose the real bottleneck** — measure processing time and wait time on one pipeline first. Don't guess.
2. **Build the minimal artifact chain** — every step human-triggered, artifacts readable, every gate has an owner. Get intent → spec → plan working first.
3. **Feed implementation a feedback loop** — unified build / test / lint entry points, clear healthy output.
4. **Version organizational knowledge** — the four carrier layers in place.
5. **Read-only automation first, PR write access later** — only after read-only automation is stable, allow auto-fixing lint and docs.
6. **Close the maintenance loop last** — identity, sandboxes, short-lived credentials, branch protection, production gates, and rollback all rehearsed before letting deterministic triggers auto-invoke diagnostics.

Two prerequisites — missing either one means stop:

- **No scaling up parallelism or auto-accept before feedback is reliable.** When parallel sessions exceed human review capacity, output gets faster and decision quality gets worse.
- **Legacy systems must have baselines reverse-extracted first.** Old systems have no invariants; sending AI in only accelerates the mess. The trap during extraction is cementing historical compromises as rules — low-confidence "rules" don't enter the baseline; they go into the risk section of a separate ADR, otherwise the bug becomes legal.

## Closing

This is not cheap. It means writing three extra documents per change, keeping an extra independent session alive, running a few more CI checks, and accepting a 20% slowdown during the pilot.

What you get back is one auditable fact per change: why it was made, under which assumptions, who approved it, where it deviated, and how to roll it back if it breaks.

Installing the tools is day one. Turning handoff, control, and feedback into artifacts, gates, and metrics — that is the transformation.
